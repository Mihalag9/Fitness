-- Procedure: get_trainer_statistics
DROP FUNCTION IF EXISTS get_trainer_statistics();
CREATE OR REPLACE FUNCTION get_trainer_statistics()
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
    SELECT json_build_object(
        'totalTrainers', COUNT(*),
        'trainersWithExperience', COUNT(CASE WHEN "Experience" > 2 THEN 1 END),
        'trainersWithoutExperience', COUNT(CASE WHEN "Experience" IS NULL OR "Experience" = 0 THEN 1 END)
    ) INTO result
    FROM "Trainer";
    RETURN result;
END;
$$ LANGUAGE plpgsql;
