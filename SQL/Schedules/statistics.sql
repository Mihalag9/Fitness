-- Function: get_schedule_statistics
CREATE OR REPLACE FUNCTION get_schedule_statistics()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalSchedules', (SELECT COUNT(*) FROM "Schedule"),
        'groupWorkouts', (SELECT COUNT(*) FROM "Schedule" s
                          JOIN "WorkoutType" wt ON s."WorkoutTypeId" = wt."WorkoutTypeId"
                          WHERE wt."TypeName" = 'групповая'),
        'individualWorkouts', (SELECT COUNT(*) FROM "Schedule" s
                               JOIN "WorkoutType" wt ON s."WorkoutTypeId" = wt."WorkoutTypeId"
                               WHERE wt."TypeName" = 'индивидуальная'),
        'trainersCount', (SELECT COUNT(DISTINCT "TrainerId") FROM "Schedule" WHERE "TrainerId" IS NOT NULL)
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;
