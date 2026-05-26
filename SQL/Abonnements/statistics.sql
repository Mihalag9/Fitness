-- Procedure: get_abonnement_statistics
DROP FUNCTION IF EXISTS get_abonnement_statistics();
CREATE OR REPLACE FUNCTION get_abonnement_statistics()
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
    SELECT json_build_object(
        'totalAbonnements', COUNT(*),
        'minPrice', COALESCE(MIN("Price"), 0),
        'maxPrice', COALESCE(MAX("Price"), 0),
        'unlimitedPercentage', ROUND(COUNT(CASE WHEN "DurationMonths" >= 12 THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2)
    ) INTO result
    FROM "Abonnement";
    RETURN result;
END;
$$ LANGUAGE plpgsql;
