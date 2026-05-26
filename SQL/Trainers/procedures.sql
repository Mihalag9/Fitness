-- Procedure: get_all_trainers
CREATE OR REPLACE FUNCTION get_all_trainers(
    p_fullname VARCHAR DEFAULT NULL,
    p_no_experience BOOLEAN DEFAULT FALSE
)
RETURNS TABLE("TrainerId" INTEGER, "FullName" VARCHAR, "Experience" INTEGER) AS $$
BEGIN
    RETURN QUERY 
    SELECT t."TrainerId", t."FullName", t."Experience"
    FROM "Trainer" t
    WHERE (p_fullname IS NULL OR t."FullName" ILIKE '%' || p_fullname || '%')
      AND (p_no_experience = FALSE OR (t."Experience" IS NULL OR t."Experience" = 0))
    ORDER BY t."FullName";
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
RETURNS INTEGER AS $$
DECLARE new_id INTEGER;
BEGIN
    INSERT INTO "Trainer" ("FullName", "Experience") VALUES (trim(p_fullname), p_experience) RETURNING "TrainerId" INTO new_id;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Procedure: update_trainer
CREATE OR REPLACE FUNCTION update_trainer(p_id INTEGER, p_fullname VARCHAR, p_experience INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Trainer" WHERE "TrainerId" = p_id) THEN RETURN FALSE; END IF;
    UPDATE "Trainer" SET "FullName" = trim(p_fullname), "Experience" = p_experience WHERE "TrainerId" = p_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Procedure: delete_trainer
CREATE OR REPLACE FUNCTION delete_trainer(p_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Trainer" WHERE "TrainerId" = p_id) THEN RETURN FALSE; END IF;
    DELETE FROM "Trainer" WHERE "TrainerId" = p_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
