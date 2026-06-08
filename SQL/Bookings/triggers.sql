-- ==========================================
-- ТРИГГЕРЫ ДЛЯ ТАБЛИЦЫ Booking
-- ==========================================

-- Trigger 1: Проверка лимита записей
CREATE OR REPLACE FUNCTION trg_check_booking_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_type VARCHAR;
    v_max INTEGER;
    v_count INTEGER;
BEGIN
    SELECT wt."TypeName" INTO v_type
    FROM "Schedule" s
    JOIN "WorkoutType" wt ON s."WorkoutTypeId" = wt."WorkoutTypeId"
    WHERE s."ScheduleId" = NEW."ScheduleId";

    SELECT COUNT(*) INTO v_count
    FROM "Booking"
    WHERE "ScheduleId" = NEW."ScheduleId";

    IF v_type = 'индивидуальная' THEN
        IF v_count >= 1 THEN
            RAISE EXCEPTION 'На индивидуальную тренировку может быть записан только 1 клиент';
        END IF;
    ELSE
        SELECT w."MaxParticipants" INTO v_max
        FROM "Schedule" s
        JOIN "Workout" w ON s."WorkoutId" = w."WorkoutId"
        WHERE s."ScheduleId" = NEW."ScheduleId";

        IF v_count >= v_max THEN
            RAISE EXCEPTION 'Все места заняты (максимум %)', v_max;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_booking_limit ON "Booking";
CREATE TRIGGER trg_check_booking_limit
    BEFORE INSERT ON "Booking"
    FOR EACH ROW
    EXECUTE FUNCTION trg_check_booking_limit();

-- Trigger 2: Проверка дубля записи
CREATE OR REPLACE FUNCTION trg_check_no_duplicate_booking()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "Booking"
        WHERE "ClientId" = NEW."ClientId" AND "ScheduleId" = NEW."ScheduleId"
    ) THEN
        RAISE EXCEPTION 'Клиент "%" уже записан на это занятие',
            (SELECT "FullName" FROM "Client" WHERE "ClientId" = NEW."ClientId");
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_no_duplicate_booking ON "Booking";
CREATE TRIGGER trg_check_no_duplicate_booking
    BEFORE INSERT ON "Booking"
    FOR EACH ROW
    EXECUTE FUNCTION trg_check_no_duplicate_booking();

-- Trigger 3: Проверка абонемента клиента
-- Проверяет наличие активного абонемента и соответствие правилам доступа
CREATE OR REPLACE FUNCTION trg_check_client_abonnement()
RETURNS TRIGGER AS $$
DECLARE
    v_weekday_access BOOLEAN;
    v_weekend_access BOOLEAN;
    v_access_start TIME;
    v_access_end TIME;
    v_work_date DATE;
    v_start_time TIME;
    v_day_of_week INTEGER;
    v_client_name VARCHAR;
BEGIN
    -- Получаем данные о расписании
    SELECT s."WorkDate", s."StartTime"
    INTO v_work_date, v_start_time
    FROM "Schedule" s
    WHERE s."ScheduleId" = NEW."ScheduleId";

    -- Ищем активный абонемент клиента
    SELECT a."WeekdayAccess", a."WeekendAccess", a."AccessStartTime", a."AccessEndTime"
    INTO v_weekday_access, v_weekend_access, v_access_start, v_access_end
    FROM "Purchase" p
    JOIN "Abonnement" a ON p."AbonnementId" = a."AbonnementId"
    WHERE p."ClientId" = NEW."ClientId"
      AND p."Status" = 'активен'
      AND p."ExpiryDate" >= v_work_date
    LIMIT 1;

    -- Если абонемент не найден
    IF v_weekday_access IS NULL THEN
        SELECT "FullName" INTO v_client_name FROM "Client" WHERE "ClientId" = NEW."ClientId";
        RAISE EXCEPTION 'У клиента "%" нет активного абонемента', v_client_name;
    END IF;

    -- Определяем день недели (1=понедельник..7=воскресенье)
    v_day_of_week := EXTRACT(ISODOW FROM v_work_date);

    -- Проверка будни/выходные
    IF v_day_of_week BETWEEN 1 AND 5 AND v_weekday_access = FALSE THEN
        RAISE EXCEPTION 'Абонемент клиента не позволяет посещать занятия в будние дни';
    END IF;

    IF v_day_of_week BETWEEN 6 AND 7 AND v_weekend_access = FALSE THEN
        RAISE EXCEPTION 'Абонемент клиента не позволяет посещать занятия в выходные дни';
    END IF;

    -- Проверка времени доступа
    IF v_start_time < v_access_start THEN
        RAISE EXCEPTION 'Время начала занятия (%) раньше времени доступа по абонементу (%)', v_start_time, v_access_start;
    END IF;

    IF v_start_time >= v_access_end THEN
        RAISE EXCEPTION 'Время начала занятия (%) позже времени доступа по абонементу (%)', v_start_time, v_access_end;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_client_abonnement ON "Booking";
CREATE TRIGGER trg_check_client_abonnement
    BEFORE INSERT ON "Booking"
    FOR EACH ROW
    EXECUTE FUNCTION trg_check_client_abonnement();
