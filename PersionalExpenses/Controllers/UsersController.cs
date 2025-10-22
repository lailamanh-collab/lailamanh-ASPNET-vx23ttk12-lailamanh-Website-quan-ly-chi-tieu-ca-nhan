using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersionalExpenses.Data;
using PersionalExpenses.Domain;
using PersionalExpenses.Models;

namespace PersionalExpenses.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")] // chỉ Admin
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    public UsersController(AppDbContext db) => _db = db;

    // ===== DTOs =====
    public record UserBriefDto(long Id, string Email, string? Name, bool IsActive, UserRole Role, DateTime CreatedAt);
    public record SetRoleDto(UserRole Role);

    // GET /api/users?keyword=&page=1&pageSize=20
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? keyword = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var q = _db.Users.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(keyword))
            q = q.Where(x => x.Email.Contains(keyword) || (x.Name != null && x.Name.Contains(keyword)));

        var total = await q.CountAsync();

        var items = await q
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new UserBriefDto(x.Id, x.Email, x.Name, x.IsActive, x.Role, x.CreatedAt))
            .ToListAsync();

        var data = new { Total = total, Page = page, PageSize = pageSize, Items = items };
        return Ok(ApiResponse<object>.Success(data, "Lấy danh sách người dùng thành công"));
    }

    // GET /api/users/{id}
    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var u = await _db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (u is null)
            return StatusCode(404, ApiResponse<object>.Error(404, "Không tìm thấy người dùng"));

        var dto = new UserBriefDto(u.Id, u.Email, u.Name, u.IsActive, u.Role, u.CreatedAt);
        return Ok(ApiResponse<UserBriefDto>.Success(dto, "Lấy thông tin người dùng thành công"));
    }

    // PUT /api/users/{id}/role
    [HttpPut("{id:long}/role")]
    public async Task<IActionResult> SetRole(long id, [FromBody] SetRoleDto dto)
    {
        var u = await _db.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (u is null)
            return StatusCode(404, ApiResponse<object>.Error(404, "Không tìm thấy người dùng"));

        u.Role = dto.Role;
        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Success(null, "Cập nhật role thành công"));
    }

    // PUT /api/users/{id}/status?active=true|false
    [HttpPut("{id:long}/status")]
    public async Task<IActionResult> SetActive(long id, [FromQuery] bool active = true)
    {
        var u = await _db.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (u is null)
            return StatusCode(404, ApiResponse<object>.Error(404, "Không tìm thấy người dùng"));

        u.IsActive = active;
        await _db.SaveChangesAsync();

        var msg = active ? "Kích hoạt người dùng thành công" : "Vô hiệu hóa người dùng thành công";
        return Ok(ApiResponse<object>.Success(null, msg));
    }

    // DELETE /api/users/{id}
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var u = await _db.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (u is null)
            return StatusCode(404, ApiResponse<object>.Error(404, "Không tìm thấy người dùng"));

        _db.Users.Remove(u);
        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Success(null, "Xóa người dùng thành công"));
    }
}
