CREATE OR REPLACE FUNCTION get_monthly_abonnement_sales(months_count INTEGER DEFAULT 6)
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
    SELECT json_agg(json_build_object(
        'year', EXTRACT(YEAR FROM date_series.d)::INTEGER,
        'month', EXTRACT(MONTH FROM date_series.d)::INTEGER,
        'count', COALESCE(s.cnt, 0)
    ) ORDER BY date_series.d)
    INTO result
    FROM (
        SELECT generate_series(
            date_trunc('month', CURRENT_DATE - (months_count - 1) * INTERVAL '1 month'),
            date_trunc('month', CURRENT_DATE),
            '1 month'
        )::date AS d
    ) date_series
    LEFT JOIN (
        SELECT date_trunc('month', p."PurchaseDate")::date AS month_start,
               COUNT(*) AS cnt
        FROM "Purchase" p
        WHERE p."PurchaseDate" >= date_trunc('month', CURRENT_DATE - (months_count - 1) * INTERVAL '1 month')
        GROUP BY date_trunc('month', p."PurchaseDate")::date
    ) s ON date_series.d = s.month_start;

    IF result IS NULL THEN
        result := '[]'::JSON;
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql;
