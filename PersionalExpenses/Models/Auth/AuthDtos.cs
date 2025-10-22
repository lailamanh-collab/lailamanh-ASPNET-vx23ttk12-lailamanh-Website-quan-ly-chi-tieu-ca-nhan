namespace PersionalExpenses.Models.Auth;

public record RegisterDto(string Email, string Password, string? Name);
public record LoginDto(string Email, string Password);
public record AuthResultDto(string AccessToken, long UserId, string Email, string Role, string? Name, string? ImgUrl);
