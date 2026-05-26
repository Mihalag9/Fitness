-- Procedure: get_all_equipments
CREATE OR REPLACE FUNCTION get_all_equipments(
    p_equipmentname VARCHAR DEFAULT NULL,
    p_brand VARCHAR DEFAULT NULL
)
RETURNS TABLE("EquipmentId" INTEGER, "EquipmentName" VARCHAR, "Brand" VARCHAR, "Model" VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT e."EquipmentId", e."EquipmentName", e."Brand", e."Model"
    FROM "Equipment" e
    WHERE (p_equipmentname IS NULL OR e."EquipmentName" ILIKE '%' || p_equipmentname || '%')
      AND (p_brand IS NULL OR e."Brand" = p_brand)
    ORDER BY e."EquipmentName" ASC;
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_equipment_by_id
CREATE OR REPLACE FUNCTION get_equipment_by_id(p_id INTEGER)
RETURNS SETOF "Equipment" AS $$
BEGIN
    RETURN QUERY SELECT * FROM "Equipment" WHERE "EquipmentId" = p_id;
END;
$$ LANGUAGE plpgsql;

-- Procedure: add_equipment
CREATE OR REPLACE FUNCTION add_equipment(p_equipmentname VARCHAR, p_brand VARCHAR, p_model VARCHAR)
RETURNS INTEGER AS $$
DECLARE new_id INTEGER;
BEGIN
    INSERT INTO "Equipment" ("EquipmentName", "Brand", "Model") 
    VALUES (trim(p_equipmentname), NULLIF(trim(p_brand), ''), NULLIF(trim(p_model), '')) 
    RETURNING "EquipmentId" INTO new_id;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Procedure: update_equipment
CREATE OR REPLACE FUNCTION update_equipment(p_id INTEGER, p_equipmentname VARCHAR, p_brand VARCHAR, p_model VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Equipment" WHERE "EquipmentId" = p_id) THEN RETURN FALSE; END IF;
    UPDATE "Equipment" 
    SET "EquipmentName" = trim(p_equipmentname), 
        "Brand" = NULLIF(trim(p_brand), ''), 
        "Model" = NULLIF(trim(p_model), '') 
    WHERE "EquipmentId" = p_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Procedure: delete_equipment
CREATE OR REPLACE FUNCTION delete_equipment(p_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Equipment" WHERE "EquipmentId" = p_id) THEN RETURN FALSE; END IF;
    DELETE FROM "Equipment" WHERE "EquipmentId" = p_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_equipment_statistics
CREATE OR REPLACE FUNCTION get_equipment_statistics()
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
    SELECT json_build_object(
        'totalEquipment', COUNT(*),
        'withBrand', COUNT(CASE WHEN "Brand" IS NOT NULL AND "Brand" <> '' THEN 1 END)
    ) INTO result
    FROM "Equipment";
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_equipment_brands
CREATE OR REPLACE FUNCTION get_equipment_brands()
RETURNS TABLE("Brand" VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT e."Brand"
    FROM "Equipment" e
    WHERE e."Brand" IS NOT NULL AND e."Brand" <> ''
    ORDER BY e."Brand" ASC;
END;
$$ LANGUAGE plpgsql;