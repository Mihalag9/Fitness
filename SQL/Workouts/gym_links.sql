-- Procedure: get_gyms_by_workout
CREATE OR REPLACE FUNCTION get_gyms_by_workout(p_workoutid INTEGER)
RETURNS TABLE("GymId" INTEGER, "GymName" VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT g."GymId", g."GymName"
    FROM "Gym" g
    JOIN "GymAllowedWorkout" gw ON g."GymId" = gw."GymId"
    WHERE gw."WorkoutId" = p_workoutid
    ORDER BY g."GymName";
END;
$$ LANGUAGE plpgsql;

-- Procedure: add_gym_allowed_workout
CREATE OR REPLACE FUNCTION add_gym_allowed_workout(p_gymid INTEGER, p_workoutid INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO "GymAllowedWorkout" ("GymId", "WorkoutId")
    VALUES (p_gymid, p_workoutid)
    ON CONFLICT DO NOTHING;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_gyms_dictionary
CREATE OR REPLACE FUNCTION get_gyms_dictionary()
RETURNS TABLE("GymId" INTEGER, "GymName" VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT g."GymId", g."GymName"
    FROM "Gym" g
    ORDER BY g."GymName";
END;
$$ LANGUAGE plpgsql;

-- Procedure: remove_gym_allowed_workout
CREATE OR REPLACE FUNCTION remove_gym_allowed_workout(p_gymid INTEGER, p_workoutid INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "GymAllowedWorkout" WHERE "GymId" = p_gymid AND "WorkoutId" = p_workoutid) THEN
        RETURN FALSE;
    END IF;
    DELETE FROM "GymAllowedWorkout" WHERE "GymId" = p_gymid AND "WorkoutId" = p_workoutid;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
