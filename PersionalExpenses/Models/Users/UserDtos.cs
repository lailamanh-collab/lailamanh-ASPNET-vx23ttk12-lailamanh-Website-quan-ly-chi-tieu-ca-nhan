namespace PersionalExpenses.Models.Users;

public record UserRegisterDto(string Email, string Password, string? Name);
public record UserDto(long Id, string Email, string? Name, DateTime CreatedAt);
