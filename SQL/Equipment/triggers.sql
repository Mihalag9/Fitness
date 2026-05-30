-- Trigger function: trg_check_equipment_unique
-- Запрещает дублирование оборудования с одинаковым названием, брендом и моделью
CREATE OR REPLACE FUNCTION trg_check_equipment_unique()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "Equipment"
        WHERE "EquipmentName" IS NOT DISTINCT FROM NEW."EquipmentName"
          AND "Brand" IS NOT DISTINCT FROM NEW."Brand"
          AND "Model" IS NOT DISTINCT FROM NEW."Model"
          AND "EquipmentId" != NEW."EquipmentId"
    ) THEN
        RAISE EXCEPTION 'Оборудование с таким названием, брендом и моделью уже существует';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Привязка триггера
DROP TRIGGER IF EXISTS trg_equipment_unique ON "Equipment";
CREATE TRIGGER trg_equipment_unique
    BEFORE INSERT OR UPDATE ON "Equipment"
    FOR EACH ROW
    EXECUTE FUNCTION trg_check_equipment_unique();
