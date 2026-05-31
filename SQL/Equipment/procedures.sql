
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

CREATE OR REPLACE FUNCTION get_equipment_by_id(p_id INTEGER)
RETURNS SETOF "Equipment" AS $$
BEGIN
    RETURN QUERY SELECT * FROM "Equipment" WHERE "EquipmentId" = p_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_equipment(p_equipmentname VARCHAR, p_brand VARCHAR, p_model VARCHAR)
RETURNS TEXT AS $$
DECLARE new_id INTEGER;
BEGIN
    INSERT INTO "Equipment" ("EquipmentName", "Brand", "Model") 
    VALUES (trim(p_equipmentname), trim(p_brand), NULLIF(trim(p_model), '')) 
    RETURNING "EquipmentId" INTO new_id;
    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_equipment(p_id INTEGER, p_equipmentname VARCHAR, p_brand VARCHAR, p_model VARCHAR)
RETURNS TEXT AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Equipment" WHERE "EquipmentId" = p_id) THEN RETURN 'NOT_FOUND'; END IF;
    UPDATE "Equipment" 
    SET "EquipmentName" = trim(p_equipmentname), 
        "Brand" = trim(p_brand), 
        "Model" = NULLIF(trim(p_model), '') 
    WHERE "EquipmentId" = p_id;
    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_equipment(p_id INTEGER)
RETURNS TEXT AS $$
DECLARE v_name VARCHAR;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Equipment" WHERE "EquipmentId" = p_id) THEN RETURN 'Оборудование не найдено'; END IF;
    SELECT "EquipmentName" INTO v_name FROM "Equipment" WHERE "EquipmentId" = p_id;
    DELETE FROM "Equipment" WHERE "EquipmentId" = p_id;
    RETURN 'Оборудование "' || v_name || '" успешно удалено';
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_equipment_statistics()
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
    SELECT json_build_object(
        'totalEquipment', COUNT(*),
        'withModel', COUNT(CASE WHEN "Model" IS NOT NULL AND "Model" <> '' THEN 1 END)
    ) INTO result
    FROM "Equipment";
    RETURN result;
END;
$$ LANGUAGE plpgsql;

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