using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using PersionalExpenses.Data;
using PersionalExpenses.Domain;
using PersionalExpenses.Models; // ApiResponse<T>

namespace PersionalExpenses.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly AppDbContext _db;
    public TransactionsController(AppDbContext db) => _db = db;

    private long CurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ===== DTOs =====
    public record TransactionCreateDto(
        long AccountId,
        TransactionType Type,
        decimal Amount,
        DateTime TrxDate,
        long? CategoryId = null,
        string? Note = null,
        long? TransferAccountId = null
    );

    public record TransactionUpdateDto(
        TransactionType Type,
        decimal Amount,
        DateTime TrxDate,
        long? CategoryId,
        string? Note,
        long? TransferAccountId
    );

    public record TransactionDto(
        long Id,
        long AccountId,
        TransactionType Type,
        decimal Amount,
        DateTime TrxDate,
        long? CategoryId,
        string? Note,
        long? TransferAccountId,
        DateTime CreatedAt
    );

    // ======================= LIST =======================
    // GET /api/transactions?from=&to=&accountId=&categoryId=&type=
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] long? accountId = null,
        [FromQuery] long? categoryId = null,
        [FromQuery] TransactionType? type = null)
    {
        var uid = CurrentUserId();
        var q = _db.Transactions.AsNoTracking().Where(t => t.UserId == uid);

        if (from.HasValue) q = q.Where(t => t.TrxDate >= from.Value);
        if (to.HasValue) q = q.Where(t => t.TrxDate <= to.Value);
        if (accountId.HasValue) q = q.Where(t => t.AccountId == accountId);
        if (categoryId.HasValue) q = q.Where(t => t.CategoryId == categoryId);
        if (type.HasValue) q = q.Where(t => t.Type == type);

        var items = await q
            .OrderByDescending(t => t.TrxDate).ThenByDescending(t => t.Id)
            .Select(t => new TransactionDto(
                t.Id, t.AccountId, t.Type, t.Amount, t.TrxDate,
                t.CategoryId, t.Note, t.TransferAccountId, t.CreatedAt))
            .ToListAsync();

        return Ok(ApiResponse<IEnumerable<TransactionDto>>.Success(items, "Lấy danh sách giao dịch thành công"));
    }

    // ======================= GET BY ID =======================
    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var uid = CurrentUserId();
        var t = await _db.Transactions.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid);

        if (t is null)
            return NotFound(ApiResponse<object>.Error(404, "Không tìm thấy giao dịch"));

        var dto = new TransactionDto(
            t.Id, t.AccountId, t.Type, t.Amount, t.TrxDate,
            t.CategoryId, t.Note, t.TransferAccountId, t.CreatedAt);

        return Ok(ApiResponse<TransactionDto>.Success(dto, "Lấy chi tiết giao dịch thành công"));
    }

    // ======================= CREATE =======================
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TransactionCreateDto dto)
    {
        var uid = CurrentUserId();

        // Amount > 0
        if (dto.Amount <= 0)
            return BadRequest(ApiResponse<object>.Error(400, "Số tiền phải lớn hơn 0"));

        // Account thuộc user
        var acc = await _db.Accounts.AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == dto.AccountId && a.UserId == uid);
        if (acc is null)
            return BadRequest(ApiResponse<object>.Error(400, "Tài khoản không hợp lệ"));

        // Validate theo loại giao dịch
        switch (dto.Type)
        {
            case TransactionType.Transfer:
                // Transfer: phải có TransferAccountId, khác AccountId, và không có CategoryId
                if (!dto.TransferAccountId.HasValue)
                    return BadRequest(ApiResponse<object>.Error(400, "Transfer cần TransferAccountId"));

                if (dto.TransferAccountId.Value == dto.AccountId)
                    return BadRequest(ApiResponse<object>.Error(400, "Tài khoản chuyển và nhận phải khác nhau"));

                var acc2 = await _db.Accounts.AsNoTracking()
                    .FirstOrDefaultAsync(a => a.Id == dto.TransferAccountId.Value && a.UserId == uid);
                if (acc2 is null)
                    return BadRequest(ApiResponse<object>.Error(400, "Tài khoản nhận không hợp lệ"));

                if (dto.CategoryId.HasValue)
                    return BadRequest(ApiResponse<object>.Error(400, "Transfer không dùng CategoryId"));
                break;

            case TransactionType.Income:
                // Income: bắt buộc CategoryId, và category phải Type=Income
                if (!dto.CategoryId.HasValue)
                    return BadRequest(ApiResponse<object>.Error(400, "Income cần CategoryId"));

                var catIn = await _db.Categories.AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Id == dto.CategoryId.Value && c.UserId == uid);
                if (catIn is null)
                    return BadRequest(ApiResponse<object>.Error(400, "Danh mục không hợp lệ"));

                if (catIn.Type != CategoryType.Income)
                    return BadRequest(ApiResponse<object>.Error(400, "Danh mục không thuộc loại Thu"));
                break;

            case TransactionType.Expense:
                // Expense: bắt buộc CategoryId, và category phải Type=Expense
                if (!dto.CategoryId.HasValue)
                    return BadRequest(ApiResponse<object>.Error(400, "Expense cần CategoryId"));

                var catEx = await _db.Categories.AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Id == dto.CategoryId.Value && c.UserId == uid);
                if (catEx is null)
                    return BadRequest(ApiResponse<object>.Error(400, "Danh mục không hợp lệ"));

                if (catEx.Type != CategoryType.Expense)
                    return BadRequest(ApiResponse<object>.Error(400, "Danh mục không thuộc loại Chi"));
                break;

            default:
                return BadRequest(ApiResponse<object>.Error(400, "Loại giao dịch không hợp lệ"));
        }

        var t = new Transaction
        {
            UserId = uid,
            AccountId = dto.AccountId,
            Type = dto.Type,
            Amount = dto.Amount,
            TrxDate = dto.TrxDate,
            CategoryId = dto.CategoryId,
            Note = dto.Note,
            TransferAccountId = dto.TransferAccountId
        };

        _db.Transactions.Add(t);
        await _db.SaveChangesAsync();

        var result = new TransactionDto(
            t.Id, t.AccountId, t.Type, t.Amount, t.TrxDate,
            t.CategoryId, t.Note, t.TransferAccountId, t.CreatedAt);

        return StatusCode(201, ApiResponse<TransactionDto>.Created(result, "Tạo giao dịch thành công"));
    }

    // ======================= UPDATE =======================
    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] TransactionUpdateDto dto)
    {
        var uid = CurrentUserId();

        var t = await _db.Transactions.FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid);
        if (t is null)
            return NotFound(ApiResponse<object>.Error(404, "Không tìm thấy giao dịch để cập nhật"));

        if (dto.Amount <= 0)
            return BadRequest(ApiResponse<object>.Error(400, "Số tiền phải lớn hơn 0"));

        // Không cho đổi AccountId/UserId qua update (giữ nguyên sổ)
        switch (dto.Type)
        {
            case TransactionType.Transfer:
                if (!dto.TransferAccountId.HasValue)
                    return BadRequest(ApiResponse<object>.Error(400, "Transfer cần TransferAccountId"));

                if (dto.TransferAccountId.Value == t.AccountId)
                    return BadRequest(ApiResponse<object>.Error(400, "Tài khoản chuyển và nhận phải khác nhau"));

                var acc2 = await _db.Accounts.AsNoTracking()
                    .FirstOrDefaultAsync(a => a.Id == dto.TransferAccountId.Value && a.UserId == uid);
                if (acc2 is null)
                    return BadRequest(ApiResponse<object>.Error(400, "Tài khoản nhận không hợp lệ"));

                if (dto.CategoryId.HasValue)
                    return BadRequest(ApiResponse<object>.Error(400, "Transfer không dùng CategoryId"));
                break;

            case TransactionType.Income:
                if (!dto.CategoryId.HasValue)
                    return BadRequest(ApiResponse<object>.Error(400, "Income cần CategoryId"));

                var catIn = await _db.Categories.AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Id == dto.CategoryId.Value && c.UserId == uid);
                if (catIn is null)
                    return BadRequest(ApiResponse<object>.Error(400, "Danh mục không hợp lệ"));

                if (catIn.Type != CategoryType.Income)
                    return BadRequest(ApiResponse<object>.Error(400, "Danh mục không thuộc loại Thu"));
                break;

            case TransactionType.Expense:
                if (!dto.CategoryId.HasValue)
                    return BadRequest(ApiResponse<object>.Error(400, "Expense cần CategoryId"));

                var catEx = await _db.Categories.AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Id == dto.CategoryId.Value && c.UserId == uid);
                if (catEx is null)
                    return BadRequest(ApiResponse<object>.Error(400, "Danh mục không hợp lệ"));

                if (catEx.Type != CategoryType.Expense)
                    return BadRequest(ApiResponse<object>.Error(400, "Danh mục không thuộc loại Chi"));
                break;

            default:
                return BadRequest(ApiResponse<object>.Error(400, "Loại giao dịch không hợp lệ"));
        }

        t.Type = dto.Type;
        t.Amount = dto.Amount;
        t.TrxDate = dto.TrxDate;
        t.CategoryId = dto.CategoryId;
        t.Note = dto.Note;
        t.TransferAccountId = dto.TransferAccountId;

        await _db.SaveChangesAsync();

        var result = new TransactionDto(
            t.Id, t.AccountId, t.Type, t.Amount, t.TrxDate,
            t.CategoryId, t.Note, t.TransferAccountId, t.CreatedAt);

        return Ok(ApiResponse<TransactionDto>.Success(result, "Cập nhật giao dịch thành công"));
    }

    // ======================= DELETE =======================
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var uid = CurrentUserId();
        var t = await _db.Transactions.FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid);
        if (t is null)
            return NotFound(ApiResponse<object>.Error(404, "Không tìm thấy giao dịch để xóa"));

        _db.Transactions.Remove(t);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse<object>.Success(null, "Xóa giao dịch thành công"));
    }
}
