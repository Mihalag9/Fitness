-- View: vw_gym_display
-- Список залов с агрегированным списком оборудования
CREATE OR REPLACE VIEW vw_gym_display AS
SELECT 
    g."GymId",
    g."GymName",
    COALESCE(
        string_agg(e."EquipmentName" || ' ×' || i."Quantity", ', ' ORDER BY e."EquipmentName"),
        ''
    ) AS "EquipmentList"
FROM "Gym" g
LEFT JOIN "Inventory" i ON g."GymId" = i."GymId"
LEFT JOIN "Equipment" e ON i."EquipmentId" = e."EquipmentId"
GROUP BY g."GymId", g."GymName";

-- View: vw_inventory_display
-- Инвентарь всех залов с данными оборудования
CREATE OR REPLACE VIEW vw_inventory_display AS
SELECT 
    i."GymId",
    i."EquipmentId",
    e."EquipmentName",
    e."Brand",
    e."Model",
    i."Quantity"
FROM "Inventory" i
JOIN "Equipment" e ON i."EquipmentId" = e."EquipmentId";
