-- Procedure: get_all_clients
CREATE OR REPLACE FUNCTION get_all_clients(
    p_fullname VARCHAR DEFAULT NULL,
    p_phone VARCHAR DEFAULT NULL,
    p_birth_date_from DATE DEFAULT NULL,
    p_birth_date_to DATE DEFAULT NULL
)
RETURNS TABLE("ClientId" INTEGER, "FullName" VARCHAR, "BirthDate" DATE, "Phone" VARCHAR) AS $$
BEGIN
    RETURN QUERY 
    SELECT c."ClientId", c."FullName", c."BirthDate", c."Phone" 
    FROM "Client" c 
    WHERE (p_fullname IS NULL OR c."FullName" ILIKE '%' || p_fullname || '%')
      AND (p_phone IS NULL OR c."Phone" LIKE '%' || p_phone || '%')
      AND (p_birth_date_from IS NULL OR c."BirthDate" >= p_birth_date_from)
      AND (p_birth_date_to IS NULL OR c."BirthDate" <= p_birth_date_to)
    ORDER BY c."ClientId";
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_client_by_id
CREATE OR REPLACE FUNCTION get_client_by_id(p_id INTEGER)
RETURNS SETOF "Client" AS $$
BEGIN
    RETURN QUERY SELECT * FROM "Client" WHERE "ClientId" = p_id;
END;
$$ LANGUAGE plpgsql;

-- Procedure: add_client
CREATE OR REPLACE FUNCTION add_client(p_fullname VARCHAR, p_birthdate DATE, p_phone VARCHAR)
RETURNS INTEGER AS $$
DECLARE new_id INTEGER;
BEGIN
    INSERT INTO "Client" ("FullName", "BirthDate", "Phone") VALUES (trim(p_fullname), p_birthdate, p_phone) RETURNING "ClientId" INTO new_id;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Procedure: update_client
CREATE OR REPLACE FUNCTION update_client(p_id INTEGER, p_fullname VARCHAR, p_birthdate DATE, p_phone VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Client" WHERE "ClientId" = p_id) THEN RETURN FALSE; END IF;
    UPDATE "Client" SET "FullName" = trim(p_fullname), "BirthDate" = p_birthdate, "Phone" = p_phone WHERE "ClientId" = p_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Procedure: delete_client
CREATE OR REPLACE FUNCTION delete_client(p_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Client" WHERE "ClientId" = p_id) THEN RETURN FALSE; END IF;
    DELETE FROM "Client" WHERE "ClientId" = p_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
