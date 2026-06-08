
CREATE OR REPLACE FUNCTION get_all_workouts(
    p_workoutname VARCHAR DEFAULT NULL,
    p_duration_from INTEGER DEFAULT NULL,
    p_duration_to INTEGER DEFAULT NULL,
    p_max_participants_min INTEGER DEFAULT NULL,
    p_max_participants_max INTEGER DEFAULT NULL,
    p_participants_sort VARCHAR DEFAULT NULL
)
RETURNS TABLE("WorkoutId" INTEGER, "WorkoutName" VARCHAR, "DurationMinutes" INTEGER, "MaxParticipants" INTEGER, "GymList" TEXT) AS $$
BEGIN
    RETURN QUERY 
    SELECT * FROM vw_workout_display v
    WHERE (p_workoutname IS NULL OR v."WorkoutName" ILIKE '%' || p_workoutname || '%')
      AND (p_duration_from IS NULL OR v."DurationMinutes" >= p_duration_from)
      AND (p_duration_to IS NULL OR v."DurationMinutes" <= p_duration_to)
      AND (p_max_participants_min IS NULL OR v."MaxParticipants" >= p_max_participants_min)
      AND (p_max_participants_max IS NULL OR v."MaxParticipants" <= p_max_participants_max)
    ORDER BY
        CASE WHEN p_participants_sort = 'asc' THEN v."MaxParticipants" END ASC NULLS LAST,
        CASE WHEN p_participants_sort = 'desc' THEN v."MaxParticipants" END DESC NULLS LAST,
        v."WorkoutName" ASC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_workout_by_id(p_id INTEGER)
RETURNS SETOF "Workout" AS $$
BEGIN
    RETURN QUERY SELECT * FROM "Workout" WHERE "WorkoutId" = p_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_workout(p_workoutname VARCHAR, p_durationminutes INTEGER, p_maxparticipants INTEGER)
RETURNS TEXT AS $$
DECLARE new_id INTEGER;
BEGIN
    IF p_workoutname IS NULL OR trim(p_workoutname) = '' THEN
        RETURN 'Название тренировки не может быть пустым';
    END IF;

    IF p_durationminutes IS NULL OR p_durationminutes < 30 OR p_durationminutes > 180 THEN
        RETURN 'Длительность тренировки должна быть от 30 до 180 минут';
    END IF;

    IF p_maxparticipants IS NULL OR p_maxparticipants < 1 OR p_maxparticipants > 50 THEN
        RETURN 'Количество участников должно быть от 1 до 50';
    END IF;

    IF EXISTS (SELECT 1 FROM "Workout" WHERE "WorkoutName" ILIKE trim(p_workoutname)) THEN
        RETURN 'Тренировка с таким названием уже существует';
    END IF;

    INSERT INTO "Workout" ("WorkoutName", "DurationMinutes", "MaxParticipants")
    VALUES (trim(p_workoutname), p_durationminutes, p_maxparticipants)
    RETURNING "WorkoutId" INTO new_id;
    RETURN 'Тренировка "' || trim(p_workoutname) || '" успешно добавлена (ID: ' || new_id || ')';
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_workout(p_id INTEGER, p_workoutname VARCHAR, p_durationminutes INTEGER, p_maxparticipants INTEGER)
RETURNS TEXT AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Workout" WHERE "WorkoutId" = p_id) THEN RETURN 'Тренировка не найдена'; END IF;

    IF p_workoutname IS NULL OR trim(p_workoutname) = '' THEN
        RETURN 'Название тренировки не может быть пустым';
    END IF;

    IF p_durationminutes IS NULL OR p_durationminutes < 5 OR p_durationminutes > 480 THEN
        RETURN 'Длительность тренировки должна быть от 5 до 480 минут';
    END IF;

    IF p_maxparticipants IS NULL OR p_maxparticipants < 1 OR p_maxparticipants > 50 THEN
        RETURN 'Количество участников должно быть от 1 до 50';
    END IF;

    IF EXISTS (SELECT 1 FROM "Workout" WHERE "WorkoutName" ILIKE trim(p_workoutname) AND "WorkoutId" != p_id) THEN
        RETURN 'Тренировка с таким названием уже существует';
    END IF;

    UPDATE "Workout"
    SET "WorkoutName" = trim(p_workoutname),
        "DurationMinutes" = p_durationminutes,
        "MaxParticipants" = p_maxparticipants
    WHERE "WorkoutId" = p_id;
    RETURN 'Тренировка "' || trim(p_workoutname) || '" успешно обновлена';
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_workout(p_id INTEGER)
RETURNS TEXT AS $$
DECLARE v_name VARCHAR;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Workout" WHERE "WorkoutId" = p_id) THEN RETURN 'Тренировка не найдена'; END IF;
    SELECT "WorkoutName" INTO v_name FROM "Workout" WHERE "WorkoutId" = p_id;
    DELETE FROM "Workout" WHERE "WorkoutId" = p_id;
    RETURN 'Тренировка "' || v_name || '" успешно удалена';
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;
