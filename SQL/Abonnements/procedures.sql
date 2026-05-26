-- Procedure: get_all_abonnements
CREATE OR REPLACE FUNCTION get_all_abonnements(
    p_abonnement_type VARCHAR DEFAULT NULL,
    p_weekday_access BOOLEAN DEFAULT NULL,
    p_weekend_access BOOLEAN DEFAULT NULL,
    p_price_min NUMERIC DEFAULT NULL,
    p_price_max NUMERIC DEFAULT NULL
)
RETURNS TABLE("AbonnementId" INTEGER, "AbonnementType" VARCHAR, "Price" NUMERIC, "DurationMonths" INTEGER, "WeekdayAccess" BOOLEAN, "WeekendAccess" BOOLEAN, "AccessStartTime" TIME, "AccessEndTime" TIME) AS $$
BEGIN
    RETURN QUERY 
    SELECT a."AbonnementId", a."AbonnementType", a."Price", a."DurationMonths", a."WeekdayAccess", a."WeekendAccess", a."AccessStartTime", a."AccessEndTime"
    FROM "Abonnement" a
    WHERE (p_abonnement_type IS NULL OR a."AbonnementType" ILIKE '%' || p_abonnement_type || '%')
      AND (p_weekday_access IS NULL OR a."WeekdayAccess" = p_weekday_access)
      AND (p_weekend_access IS NULL OR a."WeekendAccess" = p_weekend_access)
      AND (p_price_min IS NULL OR a."Price" >= p_price_min)
      AND (p_price_max IS NULL OR a."Price" <= p_price_max)
    ORDER BY a."AbonnementId";
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_abonnement_by_id
CREATE OR REPLACE FUNCTION get_abonnement_by_id(p_id INTEGER)
RETURNS SETOF "Abonnement" AS $$
BEGIN
    RETURN QUERY SELECT * FROM "Abonnement" WHERE "AbonnementId" = p_id;
END;
$$ LANGUAGE plpgsql;

-- Procedure: add_abonnement
CREATE OR REPLACE FUNCTION add_abonnement(p_type VARCHAR, p_price NUMERIC, p_months INTEGER, p_weekday BOOLEAN, p_weekend BOOLEAN, p_start TIME, p_end TIME)
RETURNS INTEGER AS $$
DECLARE new_id INTEGER;
BEGIN
    INSERT INTO "Abonnement" ("AbonnementType", "Price", "DurationMonths", "WeekdayAccess", "WeekendAccess", "AccessStartTime", "AccessEndTime")
    VALUES (trim(p_type), p_price, p_months, p_weekday, p_weekend, p_start, p_end) RETURNING "AbonnementId" INTO new_id;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Procedure: update_abonnement
CREATE OR REPLACE FUNCTION update_abonnement(p_id INTEGER, p_type VARCHAR, p_price NUMERIC, p_months INTEGER, p_weekday BOOLEAN, p_weekend BOOLEAN, p_start TIME, p_end TIME)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Abonnement" WHERE "AbonnementId" = p_id) THEN RETURN FALSE; END IF;
    UPDATE "Abonnement" SET "AbonnementType" = trim(p_type), "Price" = p_price, "DurationMonths" = p_months, 
    "WeekdayAccess" = p_weekday, "WeekendAccess" = p_weekend, "AccessStartTime" = p_start, "AccessEndTime" = p_end 
    WHERE "AbonnementId" = p_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Procedure: delete_abonnement
CREATE OR REPLACE FUNCTION delete_abonnement(p_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Abonnement" WHERE "AbonnementId" = p_id) THEN RETURN FALSE; END IF;
    DELETE FROM "Abonnement" WHERE "AbonnementId" = p_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
