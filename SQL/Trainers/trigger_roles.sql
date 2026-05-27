-- Trigger function to enforce Lead Trainer constraints
CREATE OR REPLACE FUNCTION check_lead_trainer_constraint()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Если роль не "ведущий тренер", ограничений нет
    IF NEW."TRole" != 'ведущий тренер' THEN
        RETURN NEW;
    END IF;

    -- 2. "на тренировке ведущим тренером может являться только 1 человек"
    IF EXISTS (
        SELECT 1 FROM "TrainerRole"
        WHERE "WorkoutId" = NEW."WorkoutId" 
          AND "TRole" = 'ведущий тренер'
          AND "TrainerId" != NEW."TrainerId" -- исключаем текущую запись при обновлении
    ) THEN
        RAISE EXCEPTION 'На тренировке уже есть ведущий тренер.';
    END IF;

    -- 3. "этот человек не может быть ведущим нигде более"
    IF EXISTS (
        SELECT 1 FROM "TrainerRole"
        WHERE "TrainerId" = NEW."TrainerId"
          AND "TRole" = 'ведущий тренер'
          AND "WorkoutId" != NEW."WorkoutId" -- исключаем текущую тренировку
    ) THEN
        RAISE EXCEPTION 'Тренер уже является ведущим на другой тренировке.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger
DROP TRIGGER IF EXISTS trg_check_lead_trainer ON "TrainerRole";
CREATE TRIGGER trg_check_lead_trainer
BEFORE INSERT OR UPDATE ON "TrainerRole"
FOR EACH ROW EXECUTE FUNCTION check_lead_trainer_constraint();
