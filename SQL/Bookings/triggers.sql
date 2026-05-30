-- ==========================================
-- ТРИГГЕРЫ ДЛЯ ТАБЛИЦЫ Booking
-- ==========================================

-- Trigger 1: Проверка лимита записей
-- Групповая: количество записей < MaxParticipants
-- Индивидуальная: количество записей = 0 (только 1 клиент)
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
