CREATE OR REPLACE VIEW vw_workout_display AS
SELECT 
    w."WorkoutId",
    w."WorkoutName",
    w."DurationMinutes",
    w."MaxParticipants",
    COALESCE(string_agg(DISTINCT g."GymName", ', ' ORDER BY g."GymName"), '') AS "GymList"
FROM "Workout" w
LEFT JOIN "GymAllowedWorkout" gw ON w."WorkoutId" = gw."WorkoutId"
LEFT JOIN "Gym" g ON gw."GymId" = g."GymId"
GROUP BY w."WorkoutId", w."WorkoutName", w."DurationMinutes", w."MaxParticipants";
