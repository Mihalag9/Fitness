using Fitness.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<FitnessContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()  // Разрешить запросы с любых источников (для учебных целей)
            .AllowAnyMethod()  // Разрешить любые HTTP-методы (GET, POST, ...)
            .AllowAnyHeader(); // Разрешить любые заголовки
    });
});
var app = builder.Build();
app.UseCors("AllowAll");
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseDefaultFiles(); // Ищет файлы по умолчанию (index.html) 
app.UseStaticFiles(); // Подключает статические файлы 
app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
