using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PersionalExpenses.Data;
using PersionalExpenses.Domain;
using PersionalExpenses.Models; // ApiResponse<T>
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.ComponentModel.DataAnnotations;

namespace PersionalExpenses.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _cfg;

    public AuthController(AppDbContext db, IConfiguration cfg)
    {
        _db = db;
        _cfg = cfg;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(ApiResponse<object>.Error(400, "Email và mật khẩu là bắt buộc"));

        if (await _db.Users.AnyAsync(x => x.Email == dto.Email))
            return StatusCode(409, ApiResponse<object>.Error(409, "Email đã tồn tại"));

        await using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var (hash, salt) = HashPassword(dto.Password);
            var u = new User
            {
                Email = dto.Email,
                PasswordHash = hash,
                PasswordSalt = salt,
                Name = dto.Name,
                Role = UserRole.User,
                IsActive = true
            };
            _db.Users.Add(u);
            await _db.SaveChangesAsync();

            // Tạo category mặc định cho user mới
            await SeedDefaultCategoriesForUserAsync(u.Id);

            await tx.CommitAsync();

            var token = IssueJwt(u);
            var payload = new AuthResultDto(token, u.Id, u.Email, u.Role.ToString(), u.Name, u.ImgUrl);
            return StatusCode(201, ApiResponse<AuthResultDto>.Created(payload, "Tạo tài khoản thành công"));
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(ApiResponse<object>.Error(400, "Email và mật khẩu là bắt buộc"));

        var u = await _db.Users.FirstOrDefaultAsync(x => x.Email == dto.Email);
        if (u is null)
            return StatusCode(401, ApiResponse<object>.Error(401, "Email không tồn tại"));

        if (!u.IsActive)
            return StatusCode(403, ApiResponse<object>.Error(403, "Tài khoản đã bị khóa"));

        if (!VerifyPassword(dto.Password, u.PasswordHash, u.PasswordSalt))
            return StatusCode(401, ApiResponse<object>.Error(401, "Mật khẩu không đúng"));

        var token = IssueJwt(u);
        var payload = new AuthResultDto(token, u.Id, u.Email, u.Role.ToString(), u.Name, u.ImgUrl);
        return Ok(ApiResponse<AuthResultDto>.Success(payload, "Đăng nhập thành công"));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var sid = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(sid))
            return StatusCode(401, ApiResponse<object>.Error(401, "Chưa đăng nhập"));

        var userId = long.Parse(sid);
        var u = await _db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == userId);
        if (u is null)
            return StatusCode(404, ApiResponse<object>.Error(404, "Không tìm thấy người dùng"));

        var data = new { u.Id, u.Email, u.Name, Role = u.Role.ToString(), u.IsActive, u.CreatedAt };
        return Ok(ApiResponse<object>.Success(data));
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
        => Ok(ApiResponse<object>.Success(null, "Đăng xuất thành công"));

    // ================== SEED CATEGORIES ==================

    private async Task SeedDefaultCategoriesForUserAsync(long userId)
    {
        if (await _db.Categories.AnyAsync(c => c.UserId == userId))
            return;

        var expenses = new (string name, string icon, string color)[]
        {
            ("Ăn uống", "🍽️", "#f59e0b"),
            ("Chi tiêu hàng ngày", "🧾", "#9ca3af"),
            ("Quần áo", "👕", "#a855f7"),
            ("Mỹ phẩm", "💄", "#f472b6"),
            ("Phí giao lưu", "🫱🏻‍🫲🏼", "#22c55e"),
            ("Y tế", "🩺", "#ef4444"),
            ("Giáo dục", "📚", "#06b6d4"),
            ("Tiền điện", "⚡", "#fde047"),
            ("Đi lại", "🚗", "#3b82f6"),
            ("Phí liên lạc", "📞", "#10b981"),
            ("Tiền nhà", "🏠", "#8b5cf6"),
        };

        var incomes = new (string name, string icon, string color)[]
        {
            ("Tiền lương", "💵", "#16a34a"),
            ("Tiền phụ cấp", "💰", "#22c55e"),
            ("Tiền thưởng", "🏆", "#84cc16"),
            ("Thu nhập phụ", "🪙", "#4ade80"),
            ("Đầu tư", "📈", "#0ea5e9"),
        };

        var list = new List<Category>();

        foreach (var e in expenses)
        {
            list.Add(new Category
            {
                UserId = userId,
                Name = e.name,
                Type = CategoryType.Expense,
                Icon = e.icon,
                Color = e.color,
                IsDefault = true,
                IsActive = true
            });
        }
        foreach (var i in incomes)
        {
            list.Add(new Category
            {
                UserId = userId,
                Name = i.name,
                Type = CategoryType.Income,
                Icon = i.icon,
                Color = i.color,
                IsDefault = true,
                IsActive = true
            });
        }

        _db.Categories.AddRange(list);
        await _db.SaveChangesAsync();
    }


    // ================== HELPERS ==================

    private string IssueJwt(User u)
    {
        var jwt = _cfg.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, u.Id.ToString()),
            new Claim(ClaimTypes.Email, u.Email),
            new Claim(ClaimTypes.Name, u.Name ?? string.Empty),
            new Claim(ClaimTypes.Role, u.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(jwt["AccessTokenMinutes"]!)),
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static (string Hash, string Salt) HashPassword(string password)
    {
        using var rng = RandomNumberGenerator.Create();
        var salt = new byte[16]; rng.GetBytes(salt);
        var hash = Rfc2898DeriveBytes.Pbkdf2(Encoding.UTF8.GetBytes(password), salt, 100_000, HashAlgorithmName.SHA256, 32);
        return (Convert.ToHexString(hash), Convert.ToHexString(salt));
    }

    private static bool VerifyPassword(string password, string hashHex, string saltHex)
    {
        var salt = Convert.FromHexString(saltHex);
        var hash = Rfc2898DeriveBytes.Pbkdf2(Encoding.UTF8.GetBytes(password), salt, 100_000, HashAlgorithmName.SHA256, 32);
        return CryptographicOperations.FixedTimeEquals(hash, Convert.FromHexString(hashHex));
    }

    // PUT /api/auth/me/profile
    [HttpPut("me/profile")]
    [Authorize]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateMyProfileDto dto)
    {
        var sid = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(sid))
            return StatusCode(401, ApiResponse<object>.Error(401, "Chưa đăng nhập"));

        var userId = long.Parse(sid);
        var u = await _db.Users.FirstOrDefaultAsync(x => x.Id == userId);
        if (u is null)
            return StatusCode(404, ApiResponse<object>.Error(404, "Không tìm thấy người dùng"));

        if (!string.IsNullOrWhiteSpace(dto.Name))
            u.Name = dto.Name.Trim();

        if (!string.IsNullOrWhiteSpace(dto.ImgUrl))
            u.ImgUrl = dto.ImgUrl.Trim();

        await _db.SaveChangesAsync();

        // 🔁 phát hành lại JWT để FE cập nhật claims (nếu cần hiển thị avatar, name)
        var token = IssueJwt(u);
        var payload = new AuthResultDto(token, u.Id, u.Email, u.Role.ToString(), u.Name, u.ImgUrl);

        return Ok(ApiResponse<AuthResultDto>.Success(payload, "Cập nhật thông tin thành công"));
    }



    // PUT /api/auth/me/password
    [HttpPut("me/password")]
    [Authorize]
    public async Task<IActionResult> ChangeMyPassword([FromBody] ChangeMyPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.OldPassword) ||
            string.IsNullOrWhiteSpace(dto.NewPassword) ||
            string.IsNullOrWhiteSpace(dto.ConfirmNewPassword))
            return BadRequest(ApiResponse<object>.Error(400, "Vui lòng nhập đầy đủ mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu"));

        if (dto.NewPassword != dto.ConfirmNewPassword)
            return BadRequest(ApiResponse<object>.Error(400, "Xác nhận mật khẩu mới không khớp"));

        var sid = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(sid))
            return StatusCode(401, ApiResponse<object>.Error(401, "Chưa đăng nhập"));

        var userId = long.Parse(sid);
        var u = await _db.Users.FirstOrDefaultAsync(x => x.Id == userId);
        if (u is null)
            return StatusCode(404, ApiResponse<object>.Error(404, "Không tìm thấy người dùng"));

        if (!VerifyPassword(dto.OldPassword, u.PasswordHash, u.PasswordSalt))
            return StatusCode(401, ApiResponse<object>.Error(401, "Mật khẩu cũ không đúng"));

        var (hash, salt) = HashPassword(dto.NewPassword);
        u.PasswordHash = hash;
        u.PasswordSalt = salt;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse<object>.Success(null, "Đổi mật khẩu thành công"));
    }


}

// ===== DTOs =====
public record RegisterDto(string Email, string Password, string? Name);
public record LoginDto(string Email, string Password);
public record AuthResultDto(string AccessToken, long UserId, string Email, string Role, string? Name, string? ImgUrl);
public class UpdateMyProfileDto
{
    public string? Name { get; set; }
    public string? ImgUrl { get; set; }
    public UpdateMyProfileDto() { }
}

public class ChangeMyPasswordDto
{
    public string OldPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmNewPassword { get; set; } = string.Empty;
    public ChangeMyPasswordDto() { }
}

