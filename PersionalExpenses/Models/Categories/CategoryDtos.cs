using PersionalExpenses.Domain;

namespace PersionalExpenses.Models.Categories;

public record CategoryCreateDto(long UserId, string Name, CategoryType Type, long? ParentId = null, string? Color = null, string? Icon = null);
public record CategoryUpdateDto(string Name, bool IsActive, string? Color, string? Icon);
public record CategoryDto(long Id, long UserId, string Name, CategoryType Type, long? ParentId, string? Color, string? Icon, bool IsActive, bool IsDefault);
