-- Procedure: get_all_trainer_roles
CREATE OR REPLACE FUNCTION get_all_trainer_roles()
RETURNS TABLE(
    "TrainerId" INTEGER,
    "WorkoutId" INTEGER,
    "TRole" VARCHAR,
    "WorkoutName" VARCHAR,
    "TrainerName" VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tr."TrainerId",
        tr."WorkoutId",
        tr."TRole",
        w."WorkoutName",
        t."FullName" AS "TrainerName"
    FROM "TrainerRole" tr
    JOIN "Workout" w ON tr."WorkoutId" = w."WorkoutId"
    JOIN "Trainer" t ON tr."TrainerId" = t."TrainerId"
    ORDER BY t."FullName" ASC, w."WorkoutName" ASC;
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_roles_by_trainer
CREATE OR REPLACE FUNCTION get_roles_by_trainer(p_trainerid INTEGER)
RETURNS TABLE(
    "TrainerId" INTEGER,
    "WorkoutId" INTEGER,
    "TRole" VARCHAR,
    "WorkoutName" VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tr."TrainerId",
        tr."WorkoutId",
        tr."TRole",
        w."WorkoutName"
    FROM "TrainerRole" tr
    JOIN "Workout" w ON tr."WorkoutId" = w."WorkoutId"
    WHERE tr."TrainerId" = p_trainerid
    ORDER BY w."WorkoutName" ASC;
END;
$$ LANGUAGE plpgsql;

-- Procedure: add_trainer_role
CREATE OR REPLACE FUNCTION add_trainer_role(p_trainerid INTEGER, p_workoutid INTEGER, p_trole VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM "TrainerRole" WHERE "TrainerId" = p_trainerid AND "WorkoutId" = p_workoutid) THEN
        RETURN FALSE;
    END IF;

    INSERT INTO "TrainerRole" ("TrainerId", "WorkoutId", "TRole")
    VALUES (p_trainerid, p_workoutid, p_trole);
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
