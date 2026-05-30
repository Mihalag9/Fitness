-- View: vw_trainer_display
-- Представление тренеров со специализациями
CREATE OR REPLACE VIEW vw_trainer_display AS
SELECT
    t."TrainerId",
    t."FullName",
    t."Experience",
    STRING_AGG(w."WorkoutName" || ' (' || tr."TRole" || ')', E'\n'
        ORDER BY w."WorkoutName") AS "Specializations"
FROM "Trainer" t
LEFT JOIN "TrainerRole" tr ON t."TrainerId" = tr."TrainerId"
LEFT JOIN "Workout" w ON tr."WorkoutId" = w."WorkoutId"
GROUP BY t."TrainerId", t."FullName", t."Experience";
