using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using PersionalExpenses.Data;      // AppDbContext
using PersionalExpenses.Domain;    // User, UserRole

var builder = WebApplication.CreateBuilder(args);

// ========== DB ==========
var connStr = builder.Configuration.GetConnectionString("Default")
              ?? throw new InvalidOperationException("Missing ConnectionStrings:Default");
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseMySql(connStr, ServerVersion.AutoDetect(connStr))
);

// ========== CORS ==========
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact5173", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ========== Controllers & Swagger ==========
builder.Services.AddControllers();

// Swagger + Bearer (dán RAW token, KHÔNG gõ "Bearer ")
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "PersionalExpenses API", Version = "v1" });
    var scheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Dán RAW token (không gõ 'Bearer ')",
        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
    };
    c.AddSecurityDefinition("Bearer", scheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { { scheme, Array.Empty<string>() } });
});

// ========== JWT ==========
var jwt = builder.Configuration.GetSection("Jwt");
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));

builder.Services.AddAuthentication(o =>
{
    o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    o.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    o.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(o =>
{
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwt["Issuer"],
        ValidAudience = jwt["Audience"],
        IssuerSigningKey = key,
        ClockSkew = TimeSpan.Zero
    };
});

// 🔒 Mặc định bắt buộc đăng nhập cho TẤT CẢ endpoint
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = options.DefaultPolicy;       // == yêu cầu [Authorize] mọi nơi
    options.AddPolicy("AdminOnly", p => p.RequireRole("Admin"));
});

var app = builder.Build();

// (tuỳ chọn) migrate + seed admin
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    if (!db.Users.Any(u => u.Role == UserRole.Admin))
    {
        SeedAdmin(db, "admin@example.com", "Admin@123", "Administrator");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowReact5173");
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();

// ===== helper seed =====
static void SeedAdmin(AppDbContext db, string email, string password, string name)
{
    using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
    var salt = new byte[16]; rng.GetBytes(salt);
    var hash = System.Security.Cryptography.Rfc2898DeriveBytes.Pbkdf2(
        System.Text.Encoding.UTF8.GetBytes(password),
        salt, 100_000,
        System.Security.Cryptography.HashAlgorithmName.SHA256,
        32);

    db.Users.Add(new User
    {
        Email = email,
        PasswordSalt = Convert.ToHexString(salt),
        PasswordHash = Convert.ToHexString(hash),
        Name = name,
        Role = UserRole.Admin,
        IsActive = true
    });
    db.SaveChanges();
}
