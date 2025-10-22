using PersionalExpenses.Domain;

namespace PersionalExpenses.Models.Accounts;

public record AccountCreateDto(long UserId, string Name, string Type , string Currency = "VND", decimal InitialBalance = 0);
public record AccountUpdateDto(string Name, bool IsActive, string Currency, string Type);
public record AccountDto(long Id, long UserId, string Name, string Type, string Currency, decimal InitialBalance, bool IsActive, DateTime CreatedAt);
