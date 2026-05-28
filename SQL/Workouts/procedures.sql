-- Procedure: get_all_workouts
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

-- Procedure: get_workout_by_id
CREATE OR REPLACE FUNCTION get_workout_by_id(p_id INTEGER)
RETURNS SETOF "Workout" AS $$
BEGIN
    RETURN QUERY SELECT * FROM "Workout" WHERE "WorkoutId" = p_id;
END;
$$ LANGUAGE plpgsql;

-- Procedure: add_workout
CREATE OR REPLACE FUNCTION add_workout(p_workoutname VARCHAR, p_durationminutes INTEGER, p_maxparticipants INTEGER)
RETURNS INTEGER AS $$
DECLARE new_id INTEGER;
BEGIN
    INSERT INTO "Workout" ("WorkoutName", "DurationMinutes", "MaxParticipants")
    VALUES (trim(p_workoutname), p_durationminutes, p_maxparticipants)
    RETURNING "WorkoutId" INTO new_id;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Procedure: update_workout
CREATE OR REPLACE FUNCTION update_workout(p_id INTEGER, p_workoutname VARCHAR, p_durationminutes INTEGER, p_maxparticipants INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Workout" WHERE "WorkoutId" = p_id) THEN RETURN FALSE; END IF;
    UPDATE "Workout"
    SET "WorkoutName" = trim(p_workoutname),
        "DurationMinutes" = p_durationminutes,
        "MaxParticipants" = p_maxparticipants
    WHERE "WorkoutId" = p_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Procedure: delete_workout
CREATE OR REPLACE FUNCTION delete_workout(p_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Workout" WHERE "WorkoutId" = p_id) THEN RETURN FALSE; END IF;
    DELETE FROM "Workout" WHERE "WorkoutId" = p_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
