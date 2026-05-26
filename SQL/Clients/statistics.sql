-- Procedure: get_client_statistics
DROP FUNCTION IF EXISTS get_client_statistics();
CREATE OR REPLACE FUNCTION get_client_statistics()
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
    SELECT json_build_object(
        'totalClients', COUNT(*),
        'activeAbonnements', COUNT(DISTINCT p."ClientId")
    ) INTO result
    FROM "Client" c
    LEFT JOIN "Purchase" p ON c."ClientId" = p."ClientId" AND p."Status" = 'активен';
    RETURN result;
END;
$$ LANGUAGE plpgsql;
