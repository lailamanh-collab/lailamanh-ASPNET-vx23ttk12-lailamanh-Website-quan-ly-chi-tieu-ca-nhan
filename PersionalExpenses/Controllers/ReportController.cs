using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using PersionalExpenses.Data;
using PersionalExpenses.Domain;
using PersionalExpenses.Models;

namespace PersionalExpenses.Controllers;

[ApiController]
[Route("api/report")]
[Authorize]
public class ReportController : ControllerBase
{
    private readonly AppDbContext _db;
    public ReportController(AppDbContext db) => _db = db;

    private long CurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(
        [FromQuery] long? accountId,
        [FromQuery] long? categoryId,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] string? kind 
    )
    {
        var uid = CurrentUserId();

        var q = _db.Transactions
            .AsNoTracking()
            .Include(t => t.Category)
            .Where(t => t.UserId == uid)
            .AsQueryable();

        // Lọc theo account
        if (accountId.HasValue)
            q = q.Where(t => t.AccountId == accountId.Value);

        // Lọc theo category
        if (categoryId.HasValue)
            q = q.Where(t => t.CategoryId == categoryId.Value);
        // Lọc theo thời gian (TrxDate)
        if (dateFrom.HasValue)
            q = q.Where(t => t.TrxDate >= dateFrom.Value);
        if (dateTo.HasValue)
            q = q.Where(t => t.TrxDate <= dateTo.Value);

        // Lọc theo loại giao dịch
        if (!string.IsNullOrWhiteSpace(kind))
        {
            var k = kind.Trim().ToLowerInvariant();
            if (k == "0")
                q = q.Where(t => t.Category.Type == CategoryType.Income);
            else if (k == "1")
                q = q.Where(t => t.Category.Type == CategoryType.Expense);
        }

        // Tính tổng thu và chi (Amount dương, phân loại theo Category.Type)
        var totalIncome = await q
            .Where(t => t.Category.Type == CategoryType.Income)
            .SumAsync(t => (decimal?)t.Amount) ?? 0m;

        var totalExpense = await q
            .Where(t => t.Category.Type == CategoryType.Expense)
            .SumAsync(t => (decimal?)t.Amount) ?? 0m;

        var result = new SummaryDto(
            TotalIncome: totalIncome,
            TotalExpense: totalExpense,
            Net: totalIncome - totalExpense,
            Filters: new SummaryFilterEcho(
                AccountId: accountId,
                CategoryId: categoryId,
                DateFrom: dateFrom,
                DateTo: dateTo,
                Kind: kind
            )
        );

        return Ok(ApiResponse<SummaryDto>.Success(result, "Lấy báo cáo tổng thu/chi thành công"));
    }
}

// ===== DTOs =====
public record SummaryDto(decimal TotalIncome, decimal TotalExpense, decimal Net, SummaryFilterEcho Filters);

public record SummaryFilterEcho(long? AccountId, long? CategoryId, DateTime? DateFrom, DateTime? DateTo, string? Kind);
