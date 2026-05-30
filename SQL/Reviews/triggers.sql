-- Trigger function: trg_check_review_unique
-- Запрещает дублирование отзыва от одного клиента одному тренеру
-- (составной PK (ClientId, TrainerId) и так обеспечивает уникальность,
-- но триггер даёт понятное сообщение об ошибке)
CREATE OR REPLACE FUNCTION trg_check_review_unique()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "Review"
        WHERE "ClientId" = NEW."ClientId"
          AND "TrainerId" = NEW."TrainerId"
    ) THEN
        RAISE EXCEPTION 'Отзыв от этого клиента этому тренеру уже существует';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Привязка триггера
DROP TRIGGER IF EXISTS trg_review_unique ON "Review";
CREATE TRIGGER trg_review_unique
    BEFORE INSERT ON "Review"
    FOR EACH ROW
    EXECUTE FUNCTION trg_check_review_unique();
