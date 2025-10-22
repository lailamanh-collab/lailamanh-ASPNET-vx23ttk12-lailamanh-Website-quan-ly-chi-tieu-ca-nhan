namespace PersionalExpenses.Domain;

public enum CategoryType { Income = 0, Expense = 1 }

public class Category
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string Name { get; set; } = default!;
    public CategoryType Type { get; set; }
    public long? ParentId { get; set; }
    public string? Color { get; set; }
    public string? Icon { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDefault { get; set; } = false;

    public User User { get; set; } = default!;
    public Category? Parent { get; set; }
    public ICollection<Category> Children { get; set; } = new List<Category>();
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
