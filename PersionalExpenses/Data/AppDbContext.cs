using Microsoft.EntityFrameworkCore;
using PersionalExpenses.Domain;

namespace PersionalExpenses.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}

    public DbSet<User> Users => Set<User>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Transaction> Transactions => Set<Transaction>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
            {
                e.ToTable("users");
                e.HasKey(x => x.Id);
                e.Property(x => x.Email).HasMaxLength(190).IsRequired();
                e.HasIndex(x => x.Email).IsUnique();
                e.Property(x => x.PasswordHash).HasMaxLength(255).IsRequired();
                e.Property(x => x.PasswordSalt).HasMaxLength(255).IsRequired();
                e.Property(x => x.IsActive).HasDefaultValue(true);
                e.Property(x => x.Role).HasConversion<int>();
            });


        // ACCOUNTS
        b.Entity<Account>(e =>
        {
            e.ToTable("accounts");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(120).IsRequired();
            e.Property(x => x.Currency).HasMaxLength(10).HasDefaultValue("VND");
            e.Property(x => x.InitialBalance).HasColumnType("decimal(18,2)");
            e.HasOne(x => x.User).WithMany(u => u.Accounts).HasForeignKey(x => x.UserId);
        });

        // CATEGORIES
        b.Entity<Category>(e =>
        {
            e.ToTable("categories");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(120).IsRequired();
            e.Property(x => x.Color).HasMaxLength(16);
            e.Property(x => x.Icon).HasMaxLength(64);
            e.HasOne(x => x.User).WithMany(u => u.Categories).HasForeignKey(x => x.UserId);
            e.HasOne(x => x.Parent).WithMany(p => p.Children)
                .HasForeignKey(x => x.ParentId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // TRANSACTIONS
        b.Entity<Transaction>(e =>
        {
            e.ToTable("transactions");
            e.HasKey(x => x.Id);
            e.Property(x => x.Amount).HasColumnType("decimal(18,2)");
            e.HasIndex(x => new { x.UserId, x.TrxDate });
            e.HasOne(x => x.User).WithMany(u => u.Transactions).HasForeignKey(x => x.UserId);
            e.HasOne(x => x.Account).WithMany(a => a.Transactions).HasForeignKey(x => x.AccountId);
            e.HasOne(x => x.Category).WithMany(c => c.Transactions).HasForeignKey(x => x.CategoryId);
            e.HasOne(x => x.TransferAccount).WithMany()
                .HasForeignKey(x => x.TransferAccountId)
                .OnDelete(DeleteBehavior.NoAction);
        });
    }
}
