using PersionalExpenses.Domain;

namespace PersionalExpenses.Models.Users;

public record UserBriefDto(long Id, string Email, string? Name, bool IsActive, UserRole Role, DateTime CreatedAt);
public record SetRoleDto(UserRole Role);
