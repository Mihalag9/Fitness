-- Procedure: get_all_schedules
CREATE OR REPLACE FUNCTION get_all_schedules(
    p_trainer_name VARCHAR DEFAULT NULL,
    p_gym_name VARCHAR DEFAULT NULL,
    p_workout_name VARCHAR DEFAULT NULL,
    p_workout_type_id INTEGER DEFAULT NULL,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL,
    p_client_name VARCHAR DEFAULT NULL
)
RETURNS TABLE(
    "ScheduleId" INTEGER,
    "TrainerId" INTEGER,
    "TrainerName" VARCHAR,
    "WorkoutId" INTEGER,
    "WorkoutName" VARCHAR,
    "DurationMinutes" INTEGER,
    "MaxParticipants" INTEGER,
    "GymId" INTEGER,
    "GymName" VARCHAR,
    "WorkoutTypeId" INTEGER,
    "WorkoutTypeName" VARCHAR,
    "WorkDate" DATE,
    "StartTime" TIME,
    "EndTime" TIME
) AS $$
BEGIN
    RETURN QUERY
    SELECT v."ScheduleId", v."TrainerId", v."TrainerName", v."WorkoutId", v."WorkoutName",
           v."DurationMinutes", v."MaxParticipants", v."GymId", v."GymName", v."WorkoutTypeId", v."WorkoutTypeName",
           v."WorkDate", v."StartTime", v."EndTime"
    FROM vw_schedule_display v
    WHERE (p_trainer_name IS NULL OR v."TrainerName" ILIKE '%' || p_trainer_name || '%')
      AND (p_gym_name IS NULL OR v."GymName" ILIKE '%' || p_gym_name || '%')
      AND (p_workout_name IS NULL OR v."WorkoutName" ILIKE '%' || p_workout_name || '%')
      AND (p_workout_type_id IS NULL OR v."WorkoutTypeId" = p_workout_type_id)
      AND (p_date_from IS NULL OR v."WorkDate" >= p_date_from)
      AND (p_date_to IS NULL OR v."WorkDate" <= p_date_to)
      AND (p_client_name IS NULL OR EXISTS (
          SELECT 1 FROM "Booking" b
          JOIN "Client" c ON b."ClientId" = c."ClientId"
          WHERE b."ScheduleId" = v."ScheduleId"
            AND c."FullName" ILIKE '%' || p_client_name || '%'
      ))
    ORDER BY v."WorkDate" ASC, v."StartTime" ASC;
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_schedule_by_id
CREATE OR REPLACE FUNCTION get_schedule_by_id(p_id INTEGER)
RETURNS TABLE(
    "ScheduleId" INTEGER,
    "TrainerId" INTEGER,
    "TrainerName" VARCHAR,
    "WorkoutId" INTEGER,
    "WorkoutName" VARCHAR,
    "DurationMinutes" INTEGER,
    "MaxParticipants" INTEGER,
    "GymId" INTEGER,
    "GymName" VARCHAR,
    "WorkoutTypeId" INTEGER,
    "WorkoutTypeName" VARCHAR,
    "WorkDate" DATE,
    "StartTime" TIME,
    "EndTime" TIME
) AS $$
BEGIN
    RETURN QUERY
    SELECT v."ScheduleId", v."TrainerId", v."TrainerName", v."WorkoutId", v."WorkoutName",
           v."DurationMinutes", v."MaxParticipants", v."GymId", v."GymName", v."WorkoutTypeId", v."WorkoutTypeName",
           v."WorkDate", v."StartTime", v."EndTime"
    FROM vw_schedule_display v
    WHERE v."ScheduleId" = p_id;
END;
$$ LANGUAGE plpgsql;

-- Procedure: add_schedule
CREATE OR REPLACE FUNCTION add_schedule(
    p_trainer_id INTEGER,
    p_workout_id INTEGER,
    p_gym_id INTEGER,
    p_workout_type_id INTEGER,
    p_work_date DATE,
    p_start_time TIME
)
RETURNS TEXT AS $$
DECLARE
    new_id INTEGER;
    v_duration INTEGER;
    v_end_time TIME;
BEGIN
    SELECT "DurationMinutes" INTO v_duration FROM "Workout" WHERE "WorkoutId" = p_workout_id;
    v_end_time := p_start_time + (v_duration || ' minutes')::INTERVAL;

    INSERT INTO "Schedule" ("TrainerId", "WorkoutId", "GymId", "WorkoutTypeId", "WorkDate", "StartTime", "EndTime")
    VALUES (p_trainer_id, p_workout_id, p_gym_id, p_workout_type_id, p_work_date, p_start_time, v_end_time)
    RETURNING "ScheduleId" INTO new_id;

    RETURN 'Запись расписания успешно создана (ID: ' || new_id || ')';
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Procedure: update_schedule
CREATE OR REPLACE FUNCTION update_schedule(
    p_id INTEGER,
    p_trainer_id INTEGER,
    p_workout_id INTEGER,
    p_gym_id INTEGER,
    p_workout_type_id INTEGER,
    p_work_date DATE,
    p_start_time TIME
)
RETURNS TEXT AS $$
DECLARE
    v_duration INTEGER;
    v_end_time TIME;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Schedule" WHERE "ScheduleId" = p_id) THEN
        RETURN 'Запись расписания не найдена';
    END IF;

    SELECT "DurationMinutes" INTO v_duration FROM "Workout" WHERE "WorkoutId" = p_workout_id;
    v_end_time := p_start_time + (v_duration || ' minutes')::INTERVAL;

    UPDATE "Schedule"
    SET "TrainerId" = p_trainer_id,
        "WorkoutId" = p_workout_id,
        "GymId" = p_gym_id,
        "WorkoutTypeId" = p_workout_type_id,
        "WorkDate" = p_work_date,
        "StartTime" = p_start_time,
        "EndTime" = v_end_time
    WHERE "ScheduleId" = p_id;

    RETURN 'Запись расписания успешно обновлена';
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Procedure: delete_schedule
CREATE OR REPLACE FUNCTION delete_schedule(p_id INTEGER)
RETURNS TEXT AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Schedule" WHERE "ScheduleId" = p_id) THEN
        RETURN 'Запись расписания не найдена';
    END IF;
    DELETE FROM "Schedule" WHERE "ScheduleId" = p_id;
    RETURN 'Запись расписания успешно удалена';
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_trainers_dictionary_for_schedule
CREATE OR REPLACE FUNCTION get_trainers_dictionary_for_schedule()
RETURNS TABLE("TrainerId" INTEGER, "FullName" VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT t."TrainerId", t."FullName"
    FROM "Trainer" t
    ORDER BY t."FullName" ASC;
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_workouts_dictionary_for_schedule
CREATE OR REPLACE FUNCTION get_workouts_dictionary_for_schedule()
RETURNS TABLE("WorkoutId" INTEGER, "WorkoutName" VARCHAR, "DurationMinutes" INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT w."WorkoutId", w."WorkoutName", w."DurationMinutes"
    FROM "Workout" w
    ORDER BY w."WorkoutName" ASC;
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_gyms_dictionary_for_schedule
CREATE OR REPLACE FUNCTION get_gyms_dictionary_for_schedule()
RETURNS TABLE("GymId" INTEGER, "GymName" VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT g."GymId", g."GymName"
    FROM "Gym" g
    ORDER BY g."GymName" ASC;
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_workout_types_dictionary
CREATE OR REPLACE FUNCTION get_workout_types_dictionary()
RETURNS TABLE("WorkoutTypeId" INTEGER, "TypeName" VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT wt."WorkoutTypeId", wt."TypeName"
    FROM "WorkoutType" wt
    ORDER BY wt."WorkoutTypeId" ASC;
END;
$$ LANGUAGE plpgsql;
