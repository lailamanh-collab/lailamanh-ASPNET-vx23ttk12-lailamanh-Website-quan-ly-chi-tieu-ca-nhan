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
public class AccountsController : ControllerBase
{
    private readonly AppDbContext _db;
    public AccountsController(AppDbContext db) => _db = db;

    private long CurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ======================= GET ALL =======================
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var uid = CurrentUserId();
        var items = await _db.Accounts.AsNoTracking()
            .Where(a => a.UserId == uid)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AccountDto(
                a.Id, a.Name, a.Type, a.Currency, a.InitialBalance, a.IsActive, a.CreatedAt
            ))
            .ToListAsync();

        return Ok(ApiResponse<IEnumerable<AccountDto>>.Success(items, "Lấy danh sách tài khoản thành công"));
    }

    // ======================= CREATE =======================
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AccountCreateDto dto)
    {
        var uid = CurrentUserId();
        var acc = new Account
        {
            UserId = uid,
            Name = dto.Name,
            Type = dto.Type,
            Currency = dto.Currency,
            InitialBalance = dto.InitialBalance,
            IsActive = true
        };
        _db.Accounts.Add(acc);
        await _db.SaveChangesAsync();

        var result = new AccountDto(acc.Id, acc.Name, acc.Type, acc.Currency, acc.InitialBalance, acc.IsActive, acc.CreatedAt);
        return StatusCode(201, ApiResponse<AccountDto>.Created(result, "Tạo tài khoản thành công"));
    }

    // ======================= GET BY ID =======================
    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var uid = CurrentUserId();
        var a = await _db.Accounts.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid);

        if (a is null)
            return NotFound(ApiResponse<object>.Error(404, "Không tìm thấy tài khoản"));

        var dto = new AccountDto(a.Id, a.Name, a.Type, a.Currency, a.InitialBalance, a.IsActive, a.CreatedAt);
        return Ok(ApiResponse<AccountDto>.Success(dto, "Lấy chi tiết tài khoản thành công"));
    }

    // ======================= UPDATE =======================
    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] AccountUpdateDto dto)
    {
        var uid = CurrentUserId();
        var acc = await _db.Accounts.FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid);

        if (acc is null)
            return NotFound(ApiResponse<object>.Error(404, "Không tìm thấy tài khoản để cập nhật"));

        acc.Name = dto.Name;
        acc.Currency = dto.Currency;
        acc.Type = dto.Type;
        acc.IsActive = dto.IsActive;
        acc.InitialBalance = dto.InitialBalance;  

        await _db.SaveChangesAsync();

        var result = new AccountDto(acc.Id, acc.Name, acc.Type, acc.Currency, acc.InitialBalance, acc.IsActive, acc.CreatedAt);
        return Ok(ApiResponse<AccountDto>.Success(result, "Cập nhật tài khoản thành công"));
    }

    // ======================= DELETE =======================
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var uid = CurrentUserId();
        var acc = await _db.Accounts.FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid);

        if (acc is null)
            return NotFound(ApiResponse<object>.Error(404, "Không tìm thấy tài khoản để xóa"));

        _db.Accounts.Remove(acc);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse<object>.Success(null, "Xóa tài khoản thành công"));
    }
}

// ===== DTOs Accounts =====
public record AccountCreateDto(string Name, string Type, string Currency = "VND", decimal InitialBalance = 0m);
public record AccountUpdateDto(string Name, bool IsActive, string Currency, string Type, decimal InitialBalance);
public record AccountDto(long Id, string Name, string Type, string Currency, decimal InitialBalance, bool IsActive, DateTime CreatedAt);
