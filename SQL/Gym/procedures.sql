-- ==========================================
-- ПРОЦЕДУРЫ ДЛЯ ЗАЛОВ (Gym) + ИНВЕНТАРЬ (Inventory)
-- ==========================================

-- Procedure: get_all_gyms
-- Возвращает залы с агрегированным списком оборудования
CREATE OR REPLACE FUNCTION get_all_gyms(
    p_gymname VARCHAR DEFAULT NULL,
    p_has_equipment BOOLEAN DEFAULT NULL
)
RETURNS TABLE(
    "GymId" INTEGER,
    "GymName" VARCHAR,
    "EquipmentList" TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g."GymId",
        g."GymName",
        COALESCE(
            string_agg(
                e."EquipmentName" || ' ×' || i."Quantity", 
                ', ' ORDER BY e."EquipmentName"
            ),
            ''
        ) AS "EquipmentList"
    FROM "Gym" g
    LEFT JOIN "Inventory" i ON g."GymId" = i."GymId"
    LEFT JOIN "Equipment" e ON i."EquipmentId" = e."EquipmentId"
    WHERE (p_gymname IS NULL OR g."GymName" ILIKE '%' || p_gymname || '%')
      AND (
          CASE 
              WHEN p_has_equipment IS NULL THEN TRUE
              WHEN p_has_equipment = TRUE THEN EXISTS (
                  SELECT 1 FROM "Inventory" ii WHERE ii."GymId" = g."GymId"
              )
              ELSE NOT EXISTS (
                  SELECT 1 FROM "Inventory" ii WHERE ii."GymId" = g."GymId"
              )
          END
      )
    GROUP BY g."GymId", g."GymName"
    ORDER BY g."GymName" ASC;
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_gym_by_id
CREATE OR REPLACE FUNCTION get_gym_by_id(p_id INTEGER)
RETURNS SETOF "Gym" AS $$
BEGIN
    RETURN QUERY SELECT * FROM "Gym" WHERE "GymId" = p_id;
END;
$$ LANGUAGE plpgsql;

-- Procedure: add_gym
CREATE OR REPLACE FUNCTION add_gym(p_gymname VARCHAR)
RETURNS INTEGER AS $$
DECLARE new_id INTEGER;
BEGIN
    INSERT INTO "Gym" ("GymName") VALUES (trim(p_gymname)) RETURNING "GymId" INTO new_id;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Procedure: update_gym
CREATE OR REPLACE FUNCTION update_gym(p_id INTEGER, p_gymname VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Gym" WHERE "GymId" = p_id) THEN RETURN FALSE; END IF;
    UPDATE "Gym" SET "GymName" = trim(p_gymname) WHERE "GymId" = p_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Procedure: delete_gym
CREATE OR REPLACE FUNCTION delete_gym(p_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Gym" WHERE "GymId" = p_id) THEN RETURN FALSE; END IF;
    DELETE FROM "Gym" WHERE "GymId" = p_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_inventory_by_gym
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
    SELECT 
        e."EquipmentId",
        e."EquipmentName",
        e."Brand",
        e."Model",
        i."Quantity"
    FROM "Inventory" i
    JOIN "Equipment" e ON i."EquipmentId" = e."EquipmentId"
    WHERE i."GymId" = p_gymid
    ORDER BY e."EquipmentName" ASC;
END;
$$ LANGUAGE plpgsql;

-- Procedure: upsert_inventory
-- Добавляет или обновляет количество оборудования в зале
CREATE OR REPLACE FUNCTION upsert_inventory(p_gymid INTEGER, p_equipmentid INTEGER, p_quantity INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_quantity <= 0 THEN
        DELETE FROM "Inventory" WHERE "GymId" = p_gymid AND "EquipmentId" = p_equipmentid;
        RETURN TRUE;
    END IF;
    
    INSERT INTO "Inventory" ("GymId", "EquipmentId", "Quantity")
    VALUES (p_gymid, p_equipmentid, p_quantity)
    ON CONFLICT ("GymId", "EquipmentId") 
    DO UPDATE SET "Quantity" = p_quantity;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Procedure: delete_inventory_item
CREATE OR REPLACE FUNCTION delete_inventory_item(p_gymid INTEGER, p_equipmentid INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Inventory" WHERE "GymId" = p_gymid AND "EquipmentId" = p_equipmentid) 
    THEN RETURN FALSE; END IF;
    DELETE FROM "Inventory" WHERE "GymId" = p_gymid AND "EquipmentId" = p_equipmentid;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_gym_statistics
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

-- Procedure: get_all_equipment
-- Справочник оборудования для dropdown
CREATE OR REPLACE FUNCTION get_all_equipment()
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