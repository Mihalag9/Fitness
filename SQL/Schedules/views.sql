-- Представление расписания с именами вместо ID
CREATE OR REPLACE VIEW vw_schedule_display AS
SELECT
    s."ScheduleId",
    t."TrainerId",
    t."FullName" AS "TrainerName",
    w."WorkoutId",
    w."WorkoutName",
    w."DurationMinutes",
    w."MaxParticipants",
    g."GymId",
    g."GymName",
    wt."WorkoutTypeId",
    wt."TypeName" AS "WorkoutTypeName",
    s."WorkDate",
    s."StartTime",
    s."EndTime"
FROM "Schedule" s
LEFT JOIN "Trainer" t ON s."TrainerId" = t."TrainerId"
JOIN "Workout" w ON s."WorkoutId" = w."WorkoutId"
JOIN "Gym" g ON s."GymId" = g."GymId"
JOIN "WorkoutType" wt ON s."WorkoutTypeId" = wt."WorkoutTypeId";
