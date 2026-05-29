-- Trigger function: trg_check_inventory_limit
-- Ограничивает количество видов оборудования в зале до 30
CREATE OR REPLACE FUNCTION trg_check_inventory_limit() 
RETURNS TRIGGER AS $$
DECLARE v_count INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM "Inventory" 
        WHERE "GymId" = NEW."GymId" AND "EquipmentId" = NEW."EquipmentId"
    ) THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*) INTO v_count
      FROM "Inventory"
     WHERE "GymId" = NEW."GymId";

    IF v_count >= 30 THEN
        RAISE EXCEPTION 'В одном зале может быть не более 30 видов оборудования';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Привязка триггера
DROP TRIGGER IF EXISTS trg_inventory_limit ON "Inventory";
CREATE TRIGGER trg_inventory_limit
    BEFORE INSERT ON "Inventory"
    FOR EACH ROW
    EXECUTE FUNCTION trg_check_inventory_limit();
