namespace PersionalExpenses.Models.Common;

public record PagedResult<T>(IEnumerable<T> Items, int Page, int PageSize, int Total);
