CREATE OR REPLACE FUNCTION get_all_purchases(
    p_client_name VARCHAR DEFAULT NULL,
    p_abonnement_type VARCHAR DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL
)
RETURNS TABLE(
    "ClientId" INTEGER,
    "ClientName" VARCHAR,
    "AbonnementId" INTEGER,
    "AbonnementType" VARCHAR,
    "DurationMonths" INTEGER,
    "PurchaseDate" DATE,
    "ExpiryDate" DATE,
    "Status" VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT v."ClientId", v."ClientName", v."AbonnementId", v."AbonnementType",
           v."DurationMonths", v."PurchaseDate", v."ExpiryDate", v."Status"
    FROM vw_purchase_display v
    WHERE (p_client_name IS NULL OR v."ClientName" ILIKE '%' || p_client_name || '%')
      AND (p_abonnement_type IS NULL OR v."AbonnementType" ILIKE '%' || p_abonnement_type || '%')
      AND (p_status IS NULL OR v."Status" = p_status)
      AND (p_date_from IS NULL OR v."PurchaseDate" >= p_date_from)
      AND (p_date_to IS NULL OR v."PurchaseDate" <= p_date_to)
    ORDER BY v."PurchaseDate" DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_purchase(
    p_client_id INTEGER,
    p_abonnement_id INTEGER,
    p_purchase_date DATE
)
RETURNS TEXT AS $$
DECLARE
    v_duration INTEGER;
    v_expiry DATE;
BEGIN
    IF p_purchase_date < CURRENT_DATE THEN
        RETURN 'Дата начала не может быть раньше сегодняшнего дня';
    END IF;
    IF p_purchase_date > CURRENT_DATE + INTERVAL '3 months' THEN
        RETURN 'Дата начала не может быть позже 3 месяцев от сегодня';
    END IF;

    SELECT "DurationMonths" INTO v_duration
    FROM "Abonnement" WHERE "AbonnementId" = p_abonnement_id;

    IF v_duration IS NULL THEN
        RETURN 'Абонемент не найден';
    END IF;

    v_expiry := p_purchase_date + (v_duration || ' months')::INTERVAL;

    INSERT INTO "Purchase" ("ClientId", "AbonnementId", "PurchaseDate", "ExpiryDate", "Status")
    VALUES (p_client_id, p_abonnement_id, p_purchase_date, v_expiry, 'активен');

    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_purchase(
    p_client_id INTEGER,
    p_abonnement_id INTEGER,
    p_purchase_date DATE,
    p_new_status VARCHAR
)
RETURNS TEXT AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "Purchase"
        WHERE "ClientId" = p_client_id AND "AbonnementId" = p_abonnement_id AND "PurchaseDate" = p_purchase_date
    ) THEN
        RETURN 'Продажа не найдена';
    END IF;

    IF p_new_status = 'активен' AND EXISTS (
        SELECT 1 FROM "Purchase"
        WHERE "ClientId" = p_client_id
          AND "Status" = 'активен'
          AND NOT ("AbonnementId" = p_abonnement_id AND "PurchaseDate" = p_purchase_date)
    ) THEN
        RETURN 'У клиента уже есть активный абонемент';
    END IF;

    UPDATE "Purchase"
    SET "Status" = p_new_status
    WHERE "ClientId" = p_client_id AND "AbonnementId" = p_abonnement_id AND "PurchaseDate" = p_purchase_date;

    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_purchase(
    p_client_id INTEGER,
    p_abonnement_id INTEGER,
    p_purchase_date DATE
)
RETURNS TEXT AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "Purchase"
        WHERE "ClientId" = p_client_id AND "AbonnementId" = p_abonnement_id AND "PurchaseDate" = p_purchase_date
    ) THEN
        RETURN 'Продажа не найдена';
    END IF;

    DELETE FROM "Purchase"
    WHERE "ClientId" = p_client_id AND "AbonnementId" = p_abonnement_id AND "PurchaseDate" = p_purchase_date;

    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_purchase_statistics()
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
    SELECT json_build_object(
        'totalPurchases', COUNT(*),
        'activeCount', COUNT(CASE WHEN "Status" = 'активен' THEN 1 END),
        'completedCount', COUNT(CASE WHEN "Status" = 'завершен' THEN 1 END),
        'totalRevenue', COALESCE(SUM(a."Price"), 0)
    ) INTO result
    FROM "Purchase" p
    JOIN "Abonnement" a ON p."AbonnementId" = a."AbonnementId";
    RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_clients_dictionary()
RETURNS TABLE("ClientId" INTEGER, "FullName" VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT c."ClientId", c."FullName"
    FROM "Client" c
    ORDER BY c."FullName" ASC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_abonnements_dictionary()
RETURNS TABLE("AbonnementId" INTEGER, "AbonnementType" VARCHAR, "DurationMonths" INTEGER, "Price" NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT a."AbonnementId", a."AbonnementType", a."DurationMonths", a."Price"
    FROM "Abonnement" a
    ORDER BY a."AbonnementType" ASC;
END;
$$ LANGUAGE plpgsql;
