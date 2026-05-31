# Fitness Club Management System

Веб-приложение для автоматизации управления фитнес-клубом (курсовая работа).

## Стек технологий

- **Backend:** .NET 8 (ASP.NET Core Web API)
- **ORM:** Entity Framework Core 8 + Npgsql
- **Database:** PostgreSQL
- **Frontend:** HTML5, CSS3, Vanilla JS
- **API:** Swagger / OpenAPI

## Системные требования

- .NET SDK 8.0+
- PostgreSQL 16+ (сервер должен быть запущен)
- Любой современный браузер

## Быстрый старт

### 1. Настройка базы данных

Скрипт `SQL/rebuild-db.bat` сам создаёт БД `Fitness` (если её нет) и заполняет тестовыми данными.

```cmd
cd SQL
rebuild-db.bat 123
```
Где `123` — пароль пользователя `postgres`. Если пароль не нужен (pgpass.conf / trust), можно без аргумента:
```cmd
rebuild-db.bat
```

Скрипт выполняет по порядку: создание таблиц → представлений → функций → триггеров → статистик → тестовых данных (20 клиентов, 7 абонементов, 10 тренеров, 9 тренировок, 20 записей расписания, 25 броней, 15 отзывов).

### 2. Запуск приложения

```cmd
dotnet run
```

После запуска автоматически откроется браузер по адресу `http://localhost:5212/clients.html` или `https://localhost:7159/clients.html`.

### 3. Строка подключения

Если ваш PostgreSQL работает не на `localhost:5432` или пароль отличается, отредактируйте:

**`appsettings.json`** — поле `ConnectionStrings:DefaultConnection`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=Fitness;Username=postgres;Password=123"
  }
}
```

**`Models/FitnessContext.cs`** — строка 49 (используется только если контекст не сконфигурирован через DI):
```csharp
if (!optionsBuilder.IsConfigured)
    optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=Fitness;Username=postgres;Password=123");
```

Поменяйте пароль в обоих местах.

## Структура проекта

```text
├── Controllers/      # API контроллеры
├── Models/           # EF Core модели и DbContext
├── Services/         # Бизнес-логика
├── wwwroot/          # Фронтенд (HTML, CSS, JS)
├── SQL/              # SQL-скрипты и rebuild-db.bat
├── Program.cs        # Точка входа
└── appsettings.json  # Конфигурация (connection string)
```

## Тестовые данные

После `rebuild-db.bat` в БД загружаются:
- **7 абонементов**: Базовый, Годовой, Утренний, Вечерний (будни/выходные), Выходного дня
- **20 клиентов** с разными абонементами
- **10 тренеров** со специализациями
- **9 видов тренировок**: Йога, Силовая, Кроссфит, Пилатес, Сайклинг, Бокс, Самбо, Стретчинг, TRX, Спина
- **Расписание на неделю** с групповыми и индивидуальными занятиями
- **Бронирования и отзывы**
