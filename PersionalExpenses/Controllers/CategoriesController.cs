using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using PersionalExpenses.Data;
using PersionalExpenses.Domain;
using PersionalExpenses.Models;

namespace PersionalExpenses.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    public CategoriesController(AppDbContext db) => _db = db;

    private long CurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ===== DTOs =====
    public record CategoryCreateDto(string Name, CategoryType Type, long? ParentId = null, string? Color = null, string? Icon = null);
    public record CategoryUpdateDto(string Name, bool IsActive, long? ParentId = null, string? Color = null, string? Icon = null, CategoryType? Type = null);
    public record CategoryDto(long Id, string Name, CategoryType Type, long? ParentId, string? Color, string? Icon, bool IsActive, bool IsDefault);

    // GET /api/categories
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var uid = CurrentUserId();
        var items = await _db.Categories.AsNoTracking()
            .Where(c => c.UserId == uid)
            .OrderBy(c => c.Type).ThenBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Type, c.ParentId, c.Color, c.Icon, c.IsActive, c.IsDefault))
            .ToListAsync();

        return Ok(ApiResponse<IEnumerable<CategoryDto>>.Success(items, "Lấy danh sách danh mục thành công"));
    }

    // GET /api/categories/{id}
    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var uid = CurrentUserId();
        var c = await _db.Categories.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid);
        if (c is null) return NotFound(ApiResponse<object>.Error(404, "Không tìm thấy danh mục"));

        var dto = new CategoryDto(c.Id, c.Name, c.Type, c.ParentId, c.Color, c.Icon, c.IsActive, c.IsDefault);
        return Ok(ApiResponse<CategoryDto>.Success(dto, "Lấy chi tiết danh mục thành công"));
    }

    // POST /api/categories
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CategoryCreateDto dto)
    {
        var uid = CurrentUserId();

        // Validate cơ bản
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(ApiResponse<object>.Error(400, "Tên danh mục không được để trống"));

        var name = dto.Name.Trim();

        // Tên trùng trong cùng (UserId, Type, Name)
        var exists = await _db.Categories.AsNoTracking()
            .AnyAsync(x => x.UserId == uid && x.Type == dto.Type && x.Name == name);
        if (exists)
            return Conflict(ApiResponse<object>.Error(409, "Danh mục đã tồn tại trong cùng loại"));

        // Chuẩn hóa parent id
        var parentId = NormalizeParentId(dto.ParentId);

        // Nếu có parent → phải cùng User & tồn tại
        Category? parent = null;
        if (parentId.HasValue)
        {
            parent = await _db.Categories.AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == parentId.Value && p.UserId == uid);
            if (parent is null)
                return BadRequest(ApiResponse<object>.Error(400, "Parent không tồn tại hoặc không thuộc người dùng"));

            // Ràng buộc: Type của con phải KHỚP với Type của cha
            if (parent.Type != dto.Type)
                return BadRequest(ApiResponse<object>.Error(400, "Loại của danh mục con phải trùng với loại của danh mục cha"));
        }

        var c = new Category
        {
            UserId = uid,
            Name = name,
            Type = dto.Type,
            ParentId = parentId,        // null => root
            Color = dto.Color,
            Icon = dto.Icon,
            IsActive = true,
            IsDefault = false
        };

        _db.Categories.Add(c);
        await _db.SaveChangesAsync();

        var result = new CategoryDto(c.Id, c.Name, c.Type, c.ParentId, c.Color, c.Icon, c.IsActive, c.IsDefault);
        return StatusCode(201, ApiResponse<CategoryDto>.Created(result, "Tạo danh mục thành công"));
    }

    // PUT /api/categories/{id}
    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] CategoryUpdateDto dto)
    {
        var uid = CurrentUserId();
        var c = await _db.Categories.FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid);
        if (c is null) return NotFound(ApiResponse<object>.Error(404, "Không tìm thấy danh mục để cập nhật"));

        // Không cho đổi Type qua DTO (tránh lệch với con/cha); nếu muốn có thể bật, nhưng phải validate mạnh
        if (dto.Type is not null && dto.Type.Value != c.Type)
            return BadRequest(ApiResponse<object>.Error(400, "Không hỗ trợ đổi loại danh mục"));

        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(ApiResponse<object>.Error(400, "Tên danh mục không được để trống"));

        var newName = dto.Name.Trim();

        // Kiểm tra trùng tên theo (UserId, Type, Name) trừ chính nó
        var nameClash = await _db.Categories.AsNoTracking()
            .AnyAsync(x => x.UserId == uid && x.Type == c.Type && x.Name == newName && x.Id != id);
        if (nameClash)
            return Conflict(ApiResponse<object>.Error(409, "Danh mục đã tồn tại trong cùng loại"));

        var newParentId = NormalizeParentId(dto.ParentId);

        // Chặn tự tham chiếu
        if (newParentId.HasValue && newParentId.Value == id)
            return BadRequest(ApiResponse<object>.Error(400, "Danh mục không thể là cha của chính nó"));

        // Nếu có parent, kiểm tra parent tồn tại & cùng user
        if (newParentId.HasValue)
        {
            var parent = await _db.Categories.AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == newParentId.Value && p.UserId == uid);
            if (parent is null)
                return BadRequest(ApiResponse<object>.Error(400, "Parent không tồn tại hoặc không thuộc người dùng"));

            if (parent.Type != c.Type)
                return BadRequest(ApiResponse<object>.Error(400, "Loại của danh mục con phải trùng với loại của danh mục cha"));

            // Chặn vòng lặp đơn giản: parent không thể là hậu duệ của chính node đang update
            var cycle = await IsDescendant(uid, newParentId.Value, id);
            if (cycle)
                return BadRequest(ApiResponse<object>.Error(400, "Parent không hợp lệ (tạo vòng lặp)"));
        }

        c.Name = dto.Name.Trim();
        c.IsActive = dto.IsActive;
        c.Color = dto.Color;
        c.Icon = dto.Icon;
        c.ParentId = newParentId;    // null => detach to root

        await _db.SaveChangesAsync();

        var result = new CategoryDto(c.Id, c.Name, c.Type, c.ParentId, c.Color, c.Icon, c.IsActive, c.IsDefault);
        return Ok(ApiResponse<CategoryDto>.Success(result, "Cập nhật danh mục thành công"));
    }

    // DELETE /api/categories/{id}
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var uid = CurrentUserId();
        var c = await _db.Categories.FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid);
        if (c is null) return NotFound(ApiResponse<object>.Error(404, "Không tìm thấy danh mục để xóa"));

        // Chuyển tất cả con trực tiếp về root (ParentId = null) để không lỗi FK
        var children = await _db.Categories.Where(x => x.ParentId == id && x.UserId == uid).ToListAsync();
        foreach (var child in children) child.ParentId = null;

        _db.Categories.Remove(c);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse<object>.Success(null, "Xóa danh mục thành công"));
    }

    // ===== helpers =====
    private static long? NormalizeParentId(long? parentId)
        => parentId.HasValue && parentId.Value == 0 ? null : parentId;

    /// <summary>
    /// Kiểm tra childId có là hậu duệ của ancestorId (để chặn vòng lặp).
    /// </summary>
    private async Task<bool> IsDescendant(long userId, long childId, long ancestorId)
    {
        var q = new Queue<long>();
        q.Enqueue(childId);
        while (q.Count > 0)
        {
            var cur = q.Dequeue();
            if (cur == ancestorId) return true;
            var next = await _db.Categories.AsNoTracking()
                .Where(x => x.UserId == userId && x.ParentId == cur)
                .Select(x => x.Id)
                .ToListAsync();
            foreach (var n in next) q.Enqueue(n);
        }
        return false;
    }
}
