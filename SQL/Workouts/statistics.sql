-- Procedure: get_workout_statistics
CREATE OR REPLACE FUNCTION get_workout_statistics()
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
    SELECT json_build_object(
        'totalWorkouts', COUNT(*),
        'avgDuration', ROUND(AVG("DurationMinutes")),
        'maxDuration', MAX("DurationMinutes"),
        'minDuration', MIN("DurationMinutes"),
        'totalTrainersAssigned', (
            SELECT COUNT(DISTINCT "TrainerId") FROM "TrainerRole"
        )
    ) INTO result
    FROM "Workout";
    RETURN result;
END;
$$ LANGUAGE plpgsql;
