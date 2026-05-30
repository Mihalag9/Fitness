-- Trigger function: trg_check_active_subscription
-- Запрещает добавление продажи, если у клиента уже есть активный абонемент
CREATE OR REPLACE FUNCTION trg_check_active_subscription()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "Purchase"
        WHERE "ClientId" = NEW."ClientId"
          AND "Status" = 'активен'
          AND "ExpiryDate" >= CURRENT_DATE
    ) THEN
        RAISE EXCEPTION 'У клиента уже есть активный абонемент';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Привязка триггера
DROP TRIGGER IF EXISTS trg_active_subscription ON "Purchase";
CREATE TRIGGER trg_active_subscription
    BEFORE INSERT ON "Purchase"
    FOR EACH ROW
    EXECUTE FUNCTION trg_check_active_subscription();
