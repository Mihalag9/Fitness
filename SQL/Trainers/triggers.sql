-- Ограничивает количество специализаций тренера (максимум 3)
CREATE OR REPLACE FUNCTION trg_check_max_specializations()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM "TrainerRole" WHERE "TrainerId" = NEW."TrainerId") >= 3 THEN
        RAISE EXCEPTION 'У тренера не может быть более 3 специализаций';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Привязка триггера
DROP TRIGGER IF EXISTS trg_max_specializations ON "TrainerRole";
CREATE TRIGGER trg_max_specializations
    BEFORE INSERT ON "TrainerRole"
    FOR EACH ROW
    EXECUTE FUNCTION trg_check_max_specializations();
