-- Procedure: get_trainer_roles
CREATE OR REPLACE FUNCTION get_trainer_roles()
RETURNS TABLE("TrainerId" INTEGER, "WorkoutId" INTEGER, "TRole" VARCHAR) AS $$
BEGIN
    RETURN QUERY SELECT tr."TrainerId", tr."WorkoutId", tr."TRole" FROM "TrainerRole" tr;
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_trainer_role
CREATE OR REPLACE FUNCTION get_trainer_role(p_trainerid INTEGER, p_workoutid INTEGER)
RETURNS SETOF "TrainerRole" AS $$
BEGIN
    RETURN QUERY SELECT * FROM "TrainerRole" WHERE "TrainerId" = p_trainerid AND "WorkoutId" = p_workoutid;
END;
$$ LANGUAGE plpgsql;

-- Procedure: add_trainer_role
CREATE OR REPLACE FUNCTION add_trainer_role(p_trainerid INTEGER, p_workoutid INTEGER, p_trole VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM "TrainerRole" WHERE "TrainerId" = p_trainerid AND "WorkoutId" = p_workoutid) THEN
        RETURN FALSE;
    END IF;
    INSERT INTO "TrainerRole" ("TrainerId", "WorkoutId", "TRole") VALUES (p_trainerid, p_workoutid, trim(p_trole));
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Procedure: update_trainer_role
CREATE OR REPLACE FUNCTION update_trainer_role(p_trainerid INTEGER, p_workoutid INTEGER, p_trole VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "TrainerRole" WHERE "TrainerId" = p_trainerid AND "WorkoutId" = p_workoutid) THEN
        RETURN FALSE;
    END IF;
    UPDATE "TrainerRole" SET "TRole" = trim(p_trole) WHERE "TrainerId" = p_trainerid AND "WorkoutId" = p_workoutid;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Procedure: delete_trainer_role
CREATE OR REPLACE FUNCTION delete_trainer_role(p_trainerid INTEGER, p_workoutid INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "TrainerRole" WHERE "TrainerId" = p_trainerid AND "WorkoutId" = p_workoutid) THEN
        RETURN FALSE;
    END IF;
    DELETE FROM "TrainerRole" WHERE "TrainerId" = p_trainerid AND "WorkoutId" = p_workoutid;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
