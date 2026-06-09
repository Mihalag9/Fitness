
CREATE OR REPLACE FUNCTION get_all_gyms(
    p_gymname VARCHAR DEFAULT NULL,
    p_has_equipment BOOLEAN DEFAULT NULL,
    p_equipmentname VARCHAR DEFAULT NULL,
    p_brand VARCHAR DEFAULT NULL
)
RETURNS TABLE(
    "GymId" INTEGER,
    "GymName" VARCHAR,
    "EquipmentList" TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT v."GymId", v."GymName", v."EquipmentList"
    FROM vw_gym_display v
    WHERE (p_gymname IS NULL OR v."GymName" ILIKE '%' || p_gymname || '%')
      AND (
          CASE 
              WHEN p_has_equipment IS NULL THEN TRUE
              WHEN p_has_equipment = TRUE THEN v."EquipmentList" != ''
              ELSE v."EquipmentList" = ''
          END
      )
      AND (p_equipmentname IS NULL OR EXISTS (
          SELECT 1 FROM vw_inventory_display vi
          WHERE vi."GymId" = v."GymId" AND vi."EquipmentName" ILIKE '%' || p_equipmentname || '%'
      ))
      AND (p_brand IS NULL OR EXISTS (
          SELECT 1 FROM vw_inventory_display vi2
          WHERE vi2."GymId" = v."GymId" AND vi2."Brand" = p_brand
      ))
    ORDER BY v."GymName" ASC;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_gym_by_id(p_id INTEGER)
RETURNS SETOF "Gym" AS $$
BEGIN
    RETURN QUERY SELECT * FROM "Gym" WHERE "GymId" = p_id;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION add_gym(p_gymname VARCHAR)
RETURNS TEXT AS $$
DECLARE new_id INTEGER;
BEGIN
    IF p_gymname IS NULL OR trim(p_gymname) = '' THEN
        RETURN 'Название зала не может быть пустым';
    END IF;

    IF EXISTS (SELECT 1 FROM "Gym" WHERE "GymName" ILIKE trim(p_gymname)) THEN
        RETURN 'Зал с таким названием уже существует';
    END IF;

    INSERT INTO "Gym" ("GymName") VALUES (trim(p_gymname)) RETURNING "GymId" INTO new_id;
    RETURN 'Зал "' || trim(p_gymname) || '" успешно добавлен (ID: ' || new_id || ')';
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION update_gym(p_id INTEGER, p_gymname VARCHAR)
RETURNS TEXT AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Gym" WHERE "GymId" = p_id) THEN RETURN 'Зал не найден'; END IF;

    IF p_gymname IS NULL OR trim(p_gymname) = '' THEN
        RETURN 'Название зала не может быть пустым';
    END IF;

    IF EXISTS (SELECT 1 FROM "Gym" WHERE "GymName" ILIKE trim(p_gymname) AND "GymId" != p_id) THEN
        RETURN 'Зал с таким названием уже существует';
    END IF;

    UPDATE "Gym" SET "GymName" = trim(p_gymname) WHERE "GymId" = p_id;
    RETURN 'Зал "' || trim(p_gymname) || '" успешно обновлён';
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION delete_gym(p_id INTEGER)
RETURNS TEXT AS $$
DECLARE v_name VARCHAR;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Gym" WHERE "GymId" = p_id) THEN RETURN 'Зал не найден'; END IF;
    SELECT "GymName" INTO v_name FROM "Gym" WHERE "GymId" = p_id;
    DELETE FROM "Gym" WHERE "GymId" = p_id;
    RETURN 'Зал "' || v_name || '" успешно удалён';
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_inventory_by_gym(p_gymid INTEGER)
RETURNS TABLE(
    "EquipmentId" INTEGER,
    "EquipmentName" VARCHAR,
    "Brand" VARCHAR,
    "Model" VARCHAR,
    "Quantity" INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT vi."EquipmentId", vi."EquipmentName", vi."Brand", vi."Model", vi."Quantity"
    FROM vw_inventory_display vi
    WHERE vi."GymId" = p_gymid
    ORDER BY vi."EquipmentName" ASC;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION upsert_inventory(p_gymid INTEGER, p_equipmentid INTEGER, p_quantity INTEGER)
RETURNS TEXT AS $$
BEGIN
    IF p_quantity > 100 THEN
        RAISE EXCEPTION 'Количество не может превышать 100 единиц';
    END IF;

    IF p_quantity <= 0 THEN
        DELETE FROM "Inventory" WHERE "GymId" = p_gymid AND "EquipmentId" = p_equipmentid;
        RETURN 'Оборудование успешно удалено из зала';
    END IF;
    
    BEGIN
        INSERT INTO "Inventory" ("GymId", "EquipmentId", "Quantity")
        VALUES (p_gymid, p_equipmentid, p_quantity)
        ON CONFLICT ("GymId", "EquipmentId") 
        DO UPDATE SET "Quantity" = p_quantity;
    EXCEPTION WHEN OTHERS THEN
        RETURN SQLERRM;
    END;
    
    RETURN 'Количество успешно обновлено';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_inventory_item(p_gymid INTEGER, p_equipmentid INTEGER)
RETURNS TEXT AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Inventory" WHERE "GymId" = p_gymid AND "EquipmentId" = p_equipmentid) THEN
        RETURN 'Запись инвентаря не найдена';
    END IF;
    DELETE FROM "Inventory" WHERE "GymId" = p_gymid AND "EquipmentId" = p_equipmentid;
    RETURN 'Оборудование успешно удалено из зала';
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_gym_statistics()
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
    SELECT json_build_object(
        'totalGyms', (SELECT COUNT(*) FROM "Gym"),
        'totalEquipmentUnits', (SELECT COALESCE(SUM("Quantity"), 0) FROM "Inventory")
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_equipment_dictionary()
RETURNS TABLE(
    "EquipmentId" INTEGER,
    "EquipmentName" VARCHAR,
    "Brand" VARCHAR,
    "Model" VARCHAR
) AS $$
BEGIN
    RETURN QUERY 
    SELECT e."EquipmentId", e."EquipmentName", e."Brand", e."Model"
    FROM "Equipment" e
    ORDER BY e."EquipmentName" ASC;
END;
$$ LANGUAGE plpgsql;