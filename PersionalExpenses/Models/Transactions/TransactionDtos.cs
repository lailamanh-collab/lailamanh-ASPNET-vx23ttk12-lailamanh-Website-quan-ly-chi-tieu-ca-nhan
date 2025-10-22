using PersionalExpenses.Domain;

namespace PersionalExpenses.Models.Transactions;

public record TransactionCreateDto(
    long UserId,
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
    long UserId,
    long AccountId,
    TransactionType Type,
    decimal Amount,
    DateTime TrxDate,
    long? CategoryId,
    string? Note,
    long? TransferAccountId,
    DateTime CreatedAt
);
