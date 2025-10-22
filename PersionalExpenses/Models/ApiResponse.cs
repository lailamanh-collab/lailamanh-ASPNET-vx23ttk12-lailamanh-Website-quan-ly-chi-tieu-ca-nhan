namespace PersionalExpenses.Models;

public class ApiResponse<T>
{
    public int Code { get; set; }
    public string Message { get; set; } = "";
    public T? Data { get; set; }  

    public static ApiResponse<T> Success(T? data = default, string? message = null)
        => new() { Code = 200, Message = message ?? "Success", Data = data };

    public static ApiResponse<T> Created(T? data = default, string? message = null)
        => new() { Code = 201, Message = message ?? "Created", Data = data };

    public static ApiResponse<T> Error(int code, string message, T? data = default)
        => new() { Code = code, Message = message, Data = data };
}
