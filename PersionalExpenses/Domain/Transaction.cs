namespace PersionalExpenses.Domain;

public enum TransactionType { Income = 0, Expense = 1, Transfer = 2 }

public class Transaction
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public long AccountId { get; set; }
    public TransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public DateTime TrxDate { get; set; }
    public long? CategoryId { get; set; }   // null nếu transfer
    public string? Note { get; set; }
    public long? TransferAccountId { get; set; } // tài khoản nhận khi transfer
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = default!;
    public Account Account { get; set; } = default!;
    public Category? Category { get; set; }
    public Account? TransferAccount { get; set; }
}
