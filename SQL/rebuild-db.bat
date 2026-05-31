@echo off

:: Force psql to treat all SQL files as UTF-8 regardless of console code page
set PGCLIENTENCODING=UTF8

:: -------------------------------------------------------
:: Rebuild Fitness database
::   rebuild-db.bat              (pgpass.conf / trust)
::   rebuild-db.bat 123          (with password)
:: -------------------------------------------------------

set PGHOST=localhost
set PGPORT=5432
set PGUSER=postgres
set PGDATABASE=Fitness

if not "%1"=="" set "PGPASSWORD=%1"

where psql >nul 2>nul
if errorlevel 1 (
    echo [ERROR] psql not found. Add to PATH:
    echo   set PATH=%%PATH%%;C:\Program Files\PostgreSQL\16\bin
    pause
    exit /b 1
)

set DIR=%~dp0

:: -------------------------------------------------------
:: Create database if it does not exist
:: -------------------------------------------------------
echo Checking database "%PGDATABASE%"...
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='%PGDATABASE%'" 2>nul | find "1" >nul
if errorlevel 1 (
    echo Database "%PGDATABASE%" not found. Creating...
    psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -c "CREATE DATABASE \"%PGDATABASE%\""
    if errorlevel 1 (
        echo [ERROR] Failed to create database "%PGDATABASE%".
        pause
        exit /b 1
    )
    echo Database "%PGDATABASE%" created.
) else (
    echo Database "%PGDATABASE%" already exists. Recreating schema...
)
echo.

echo ========================================
echo  Rebuilding "%PGDATABASE%" on %PGHOST%:%PGPORT%
echo ========================================
echo.

psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -v ON_ERROR_STOP=1 ^
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" ^
  -f "%DIR%Tables.sql" ^
  -f "%DIR%Gym\views.sql" ^
  -f "%DIR%Purchases\views.sql" ^
  -f "%DIR%Reviews\views.sql" ^
  -f "%DIR%Schedules\views.sql" ^
  -f "%DIR%Trainers\views.sql" ^
  -f "%DIR%Workouts\views.sql" ^
  -f "%DIR%Abonnements\procedures.sql" ^
  -f "%DIR%Bookings\procedures.sql" ^
  -f "%DIR%Clients\procedures.sql" ^
  -f "%DIR%Equipment\procedures.sql" ^
  -f "%DIR%Gym\procedures.sql" ^
  -f "%DIR%Purchases\procedures.sql" ^
  -f "%DIR%Reviews\procedures.sql" ^
  -f "%DIR%Schedules\procedures.sql" ^
  -f "%DIR%Trainers\procedures.sql" ^
  -f "%DIR%Workouts\procedures.sql" ^
  -f "%DIR%Workouts\gym_links.sql" ^
  -f "%DIR%Bookings\triggers.sql" ^
  -f "%DIR%Equipment\triggers.sql" ^
  -f "%DIR%Gym\triggers.sql" ^
  -f "%DIR%Purchases\triggers.sql" ^
  -f "%DIR%Reviews\triggers.sql" ^
  -f "%DIR%Schedules\triggers.sql" ^
  -f "%DIR%Trainers\triggers.sql" ^
  -f "%DIR%Abonnements\statistics.sql" ^
  -f "%DIR%Clients\statistics.sql" ^
  -f "%DIR%Schedules\statistics.sql" ^
  -f "%DIR%Trainers\statistics.sql" ^
  -f "%DIR%Workouts\statistics.sql" ^
  -f "%DIR%Data.sql"

if errorlevel 1 (
    echo.
    echo ========================================
    echo  FAILED!
    echo ========================================
    pause
    exit /b 1
)

echo.
echo ========================================
echo  SUCCESS! Database "%PGDATABASE%" rebuilt.
echo ========================================
pause
exit /b 0
