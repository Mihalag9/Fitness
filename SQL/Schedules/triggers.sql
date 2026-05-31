-- Trigger 1: Проверка роли тренера для тренировки
CREATE OR REPLACE FUNCTION trg_check_trainer_for_workout()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."TrainerId" IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM "TrainerRole"
            WHERE "TrainerId" = NEW."TrainerId" AND "WorkoutId" = NEW."WorkoutId"
        ) THEN
            RAISE EXCEPTION 'Тренер "%" не имеет роли для тренировки "%"',
                (SELECT "FullName" FROM "Trainer" WHERE "TrainerId" = NEW."TrainerId"),
                (SELECT "WorkoutName" FROM "Workout" WHERE "WorkoutId" = NEW."WorkoutId");
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_trainer_for_workout ON "Schedule";
CREATE TRIGGER trg_check_trainer_for_workout
    BEFORE INSERT OR UPDATE ON "Schedule"
    FOR EACH ROW
    EXECUTE FUNCTION trg_check_trainer_for_workout();

-- Trigger 2: Проверка допустимости зала для тренировки
CREATE OR REPLACE FUNCTION trg_check_gym_for_workout()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "GymAllowedWorkout"
        WHERE "GymId" = NEW."GymId" AND "WorkoutId" = NEW."WorkoutId"
    ) THEN
        RAISE EXCEPTION 'Тренировка "%" не допущена в зале "%"',
            (SELECT "WorkoutName" FROM "Workout" WHERE "WorkoutId" = NEW."WorkoutId"),
            (SELECT "GymName" FROM "Gym" WHERE "GymId" = NEW."GymId");
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_gym_for_workout ON "Schedule";
CREATE TRIGGER trg_check_gym_for_workout
    BEFORE INSERT OR UPDATE ON "Schedule"
    FOR EACH ROW
    EXECUTE FUNCTION trg_check_gym_for_workout();

-- Trigger 3: Проверка что время окончания не выходит за 23:00 + вычисление EndTime
CREATE OR REPLACE FUNCTION trg_check_endtime_before_23()
RETURNS TRIGGER AS $$
DECLARE
    v_duration INTEGER;
BEGIN
    SELECT "DurationMinutes" INTO v_duration FROM "Workout" WHERE "WorkoutId" = NEW."WorkoutId";
    NEW."EndTime" := NEW."StartTime" + (v_duration || ' minutes')::INTERVAL;

    IF NEW."EndTime" > '23:00:00'::TIME THEN
        RAISE EXCEPTION 'Время окончания тренировки (%) выходит за пределы 23:00', NEW."EndTime";
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_endtime_before_23 ON "Schedule";
CREATE TRIGGER trg_check_endtime_before_23
    BEFORE INSERT OR UPDATE ON "Schedule"
    FOR EACH ROW
    EXECUTE FUNCTION trg_check_endtime_before_23();

-- Trigger 4: Проверка занятости зала
CREATE OR REPLACE FUNCTION trg_check_no_gym_conflict()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "Schedule" s
        JOIN "WorkoutType" wt ON s."WorkoutTypeId" = wt."WorkoutTypeId"
        WHERE s."GymId" = NEW."GymId"
          AND s."WorkDate" = NEW."WorkDate"
          AND s."StartTime" < NEW."EndTime"
          AND s."EndTime" > NEW."StartTime"
          AND s."ScheduleId" != NEW."ScheduleId"
          AND (
              wt."TypeName" = 'групповая'
              OR
              (SELECT wt2."TypeName" FROM "WorkoutType" wt2
               WHERE wt2."WorkoutTypeId" = NEW."WorkoutTypeId") = 'групповая'
          )
    ) THEN
        RAISE EXCEPTION 'Зал "%" уже занят на % в интервале %–%',
            (SELECT "GymName" FROM "Gym" WHERE "GymId" = NEW."GymId"),
            NEW."WorkDate",
            NEW."StartTime",
            (SELECT s."EndTime" FROM "Schedule" s
             WHERE s."GymId" = NEW."GymId"
               AND s."WorkDate" = NEW."WorkDate"
               AND s."StartTime" < NEW."EndTime"
               AND s."EndTime" > NEW."StartTime"
               AND s."ScheduleId" != NEW."ScheduleId"
             LIMIT 1);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_no_gym_conflict ON "Schedule";
CREATE TRIGGER trg_check_no_gym_conflict
    BEFORE INSERT OR UPDATE ON "Schedule"
    FOR EACH ROW
    EXECUTE FUNCTION trg_check_no_gym_conflict();

-- Trigger 5: Проверка занятости тренера
CREATE OR REPLACE FUNCTION trg_check_no_trainer_conflict()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."TrainerId" IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM "Schedule" s
            WHERE s."TrainerId" = NEW."TrainerId"
              AND s."WorkDate" = NEW."WorkDate"
              AND s."StartTime" < NEW."EndTime"
              AND s."EndTime" > NEW."StartTime"
              AND s."ScheduleId" != NEW."ScheduleId"
        ) THEN
            RAISE EXCEPTION 'Тренер "%" уже занят на % в интервале %–%',
                (SELECT "FullName" FROM "Trainer" WHERE "TrainerId" = NEW."TrainerId"),
                NEW."WorkDate",
                NEW."StartTime",
                (SELECT s."EndTime" FROM "Schedule" s
                 WHERE s."TrainerId" = NEW."TrainerId"
                   AND s."WorkDate" = NEW."WorkDate"
                   AND s."StartTime" < NEW."EndTime"
                   AND s."EndTime" > NEW."StartTime"
                   AND s."ScheduleId" != NEW."ScheduleId"
                 LIMIT 1);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_no_trainer_conflict ON "Schedule";
CREATE TRIGGER trg_check_no_trainer_conflict
    BEFORE INSERT OR UPDATE ON "Schedule"
    FOR EACH ROW
    EXECUTE FUNCTION trg_check_no_trainer_conflict();
