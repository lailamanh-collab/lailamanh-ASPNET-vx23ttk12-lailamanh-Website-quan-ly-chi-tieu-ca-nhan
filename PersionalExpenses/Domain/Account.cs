namespace PersionalExpenses.Domain;

public class Account
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string Name { get; set; } = default!;
    public string Type { get; set; } = "";  
    public string Currency { get; set; } = "VND";
    public decimal InitialBalance { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = default!;
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}

