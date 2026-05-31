-- Procedure: get_all_trainers
CREATE OR REPLACE FUNCTION get_all_trainers(
    p_fullname VARCHAR DEFAULT NULL,
    p_no_experience BOOLEAN DEFAULT FALSE,
    p_sort_experience VARCHAR DEFAULT NULL,
    p_workout_name VARCHAR DEFAULT NULL,
    p_role VARCHAR DEFAULT NULL
)
RETURNS TABLE("TrainerId" INTEGER, "FullName" VARCHAR, "Experience" INTEGER, "Specializations" TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT v."TrainerId", v."FullName", v."Experience", v."Specializations"
    FROM vw_trainer_display v
    WHERE (p_fullname IS NULL OR v."FullName" ILIKE '%' || p_fullname || '%')
      AND (CASE WHEN p_no_experience = TRUE THEN (v."Experience" IS NULL OR v."Experience" = 0) ELSE TRUE END)
      AND (p_workout_name IS NULL OR EXISTS (
          SELECT 1 FROM "TrainerRole" tr
          JOIN "Workout" w ON tr."WorkoutId" = w."WorkoutId"
          WHERE tr."TrainerId" = v."TrainerId"
            AND w."WorkoutName" ILIKE '%' || p_workout_name || '%'
      ))
      AND (p_role IS NULL OR EXISTS (
          SELECT 1 FROM "TrainerRole" tr
          WHERE tr."TrainerId" = v."TrainerId"
            AND tr."TRole" = p_role
      ))
    ORDER BY
        CASE WHEN p_sort_experience = 'asc' THEN v."Experience" END ASC NULLS LAST,
        CASE WHEN p_sort_experience = 'desc' THEN v."Experience" END DESC NULLS LAST,
        v."FullName" ASC;
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_trainer_by_id
CREATE OR REPLACE FUNCTION get_trainer_by_id(p_id INTEGER)
RETURNS SETOF "Trainer" AS $$
BEGIN
    RETURN QUERY SELECT * FROM "Trainer" WHERE "TrainerId" = p_id;
END;
$$ LANGUAGE plpgsql;

-- Procedure: add_trainer
CREATE OR REPLACE FUNCTION add_trainer(p_fullname VARCHAR, p_experience INTEGER)
RETURNS TEXT AS $$
DECLARE new_id INTEGER;
BEGIN
    INSERT INTO "Trainer" ("FullName", "Experience") VALUES (trim(p_fullname), p_experience) RETURNING "TrainerId" INTO new_id;
    RETURN 'Тренер "' || trim(p_fullname) || '" успешно добавлен (ID: ' || new_id || ')';
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Procedure: update_trainer
CREATE OR REPLACE FUNCTION update_trainer(p_id INTEGER, p_fullname VARCHAR, p_experience INTEGER)
RETURNS TEXT AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Trainer" WHERE "TrainerId" = p_id) THEN RETURN 'Тренер не найден'; END IF;
    UPDATE "Trainer" SET "FullName" = trim(p_fullname), "Experience" = p_experience WHERE "TrainerId" = p_id;
    RETURN 'Тренер "' || trim(p_fullname) || '" успешно обновлён';
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Procedure: delete_trainer
CREATE OR REPLACE FUNCTION delete_trainer(p_id INTEGER)
RETURNS TEXT AS $$
DECLARE v_name VARCHAR;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Trainer" WHERE "TrainerId" = p_id) THEN RETURN 'Тренер не найден'; END IF;
    SELECT "FullName" INTO v_name FROM "Trainer" WHERE "TrainerId" = p_id;
    DELETE FROM "Trainer" WHERE "TrainerId" = p_id;
    RETURN 'Тренер "' || v_name || '" успешно удалён';
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_trainer_roles
CREATE OR REPLACE FUNCTION get_trainer_roles()
RETURNS TABLE("TRole" VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT tr."TRole"
    FROM "TrainerRole" tr
    ORDER BY tr."TRole" ASC;
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_roles_by_trainer
CREATE OR REPLACE FUNCTION get_roles_by_trainer(p_trainer_id INTEGER)
RETURNS TABLE("WorkoutId" INTEGER, "WorkoutName" VARCHAR, "TRole" VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT w."WorkoutId", w."WorkoutName", tr."TRole"
    FROM "TrainerRole" tr
    JOIN "Workout" w ON tr."WorkoutId" = w."WorkoutId"
    WHERE tr."TrainerId" = p_trainer_id
    ORDER BY w."WorkoutName" ASC;
END;
$$ LANGUAGE plpgsql;

-- Procedure: add_trainer_role
CREATE OR REPLACE FUNCTION add_trainer_role(
    p_trainer_id INTEGER,
    p_workout_id INTEGER,
    p_role VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Trainer" WHERE "TrainerId" = p_trainer_id) THEN
        RETURN 'Тренер не найден';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Workout" WHERE "WorkoutId" = p_workout_id) THEN
        RETURN 'Тренировка не найдена';
    END IF;

    IF p_role IS NULL OR trim(p_role) = '' THEN
        RETURN 'Укажите роль';
    END IF;

    IF EXISTS (
        SELECT 1 FROM "TrainerRole"
        WHERE "TrainerId" = p_trainer_id AND "WorkoutId" = p_workout_id
    ) THEN
        RETURN 'Эта тренировка уже назначена тренеру';
    END IF;

    INSERT INTO "TrainerRole" ("TrainerId", "WorkoutId", "TRole")
    VALUES (p_trainer_id, p_workout_id, trim(p_role));

    RETURN 'Специализация успешно добавлена';
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Procedure: delete_trainer_role
CREATE OR REPLACE FUNCTION delete_trainer_role(
    p_trainer_id INTEGER,
    p_workout_id INTEGER
)
RETURNS TEXT AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "TrainerRole"
        WHERE "TrainerId" = p_trainer_id AND "WorkoutId" = p_workout_id
    ) THEN
        RETURN 'Роль не найдена';
    END IF;

    DELETE FROM "TrainerRole"
    WHERE "TrainerId" = p_trainer_id AND "WorkoutId" = p_workout_id;

    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_workouts_for_trainer_dictionary
CREATE OR REPLACE FUNCTION get_workouts_for_trainer_dictionary()
RETURNS TABLE("WorkoutId" INTEGER, "WorkoutName" VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT w."WorkoutId", w."WorkoutName"
    FROM "Workout" w
    ORDER BY w."WorkoutName" ASC;
END;
$$ LANGUAGE plpgsql;