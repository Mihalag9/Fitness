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

-- Запрещает более 5 залов на тренировку
CREATE OR REPLACE FUNCTION trg_check_gym_limit() RETURNS TRIGGER AS $$
DECLARE v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM "GymAllowedWorkout" WHERE "WorkoutId" = NEW."WorkoutId";
    IF v_count >= 5 THEN
        RAISE EXCEPTION 'Не более 5 залов на одну тренировку';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gym_limit ON "GymAllowedWorkout";
CREATE TRIGGER trg_gym_limit
    BEFORE INSERT ON "GymAllowedWorkout"
    FOR EACH ROW
    EXECUTE FUNCTION trg_check_gym_limit();

CREATE OR REPLACE FUNCTION add_gym_allowed_workout(p_gymid INTEGER, p_workoutid INTEGER)
RETURNS TEXT AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Gym" WHERE "GymId" = p_gymid) THEN
        RETURN 'Зал не найден';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Workout" WHERE "WorkoutId" = p_workoutid) THEN
        RETURN 'Тренировка не найдена';
    END IF;

    INSERT INTO "GymAllowedWorkout" ("GymId", "WorkoutId")
    VALUES (p_gymid, p_workoutid)
    ON CONFLICT DO NOTHING;

    RETURN 'Связь зала и тренировки успешно добавлена';
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_gyms_dictionary()
RETURNS TABLE("GymId" INTEGER, "GymName" VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT g."GymId", g."GymName"
    FROM "Gym" g
    ORDER BY g."GymName";
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_gym_allowed_workout(p_gymid INTEGER, p_workoutid INTEGER)
RETURNS TEXT AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "GymAllowedWorkout" WHERE "GymId" = p_gymid AND "WorkoutId" = p_workoutid) THEN
        RETURN 'Связь не найдена';
    END IF;
    DELETE FROM "GymAllowedWorkout" WHERE "GymId" = p_gymid AND "WorkoutId" = p_workoutid;
    RETURN 'Связь зала и тренировки успешно удалена';
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;
