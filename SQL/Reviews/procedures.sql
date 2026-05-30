-- Procedure: get_all_reviews
CREATE OR REPLACE FUNCTION get_all_reviews(
    p_client_name VARCHAR DEFAULT NULL,
    p_trainer_name VARCHAR DEFAULT NULL,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL,
    p_rating_sort VARCHAR DEFAULT NULL
)
RETURNS TABLE(
    "ClientId" INTEGER,
    "ClientName" VARCHAR,
    "TrainerId" INTEGER,
    "TrainerName" VARCHAR,
    "CreatedAt" TIMESTAMP,
    "ReviewText" TEXT,
    "Rating" INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT v."ClientId", v."ClientName", v."TrainerId", v."TrainerName",
           v."CreatedAt", v."ReviewText", v."Rating"
    FROM vw_review_display v
    WHERE (p_client_name IS NULL OR v."ClientName" ILIKE '%' || p_client_name || '%')
      AND (p_trainer_name IS NULL OR v."TrainerName" ILIKE '%' || p_trainer_name || '%')
      AND (p_date_from IS NULL OR v."CreatedAt"::DATE >= p_date_from)
      AND (p_date_to IS NULL OR v."CreatedAt"::DATE <= p_date_to)
    ORDER BY
        CASE WHEN p_rating_sort = 'asc' THEN v."Rating" END ASC NULLS LAST,
        CASE WHEN p_rating_sort = 'desc' THEN v."Rating" END DESC NULLS LAST,
        v."CreatedAt" DESC;
END;
$$ LANGUAGE plpgsql;

-- Procedure: add_review
CREATE OR REPLACE FUNCTION add_review(
    p_client_id INTEGER,
    p_trainer_id INTEGER,
    p_review_text TEXT,
    p_rating INTEGER
)
RETURNS TEXT AS $$
BEGIN
    -- Проверка рейтинга
    IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
        RETURN 'Рейтинг должен быть от 1 до 5';
    END IF;

    -- Проверка длины текста
    IF p_review_text IS NOT NULL AND length(p_review_text) > 300 THEN
        RETURN 'Текст отзыва не должен превышать 300 символов';
    END IF;

    INSERT INTO "Review" ("ClientId", "TrainerId", "ReviewText", "Rating")
    VALUES (p_client_id, p_trainer_id, NULLIF(p_review_text, ''), p_rating);

    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Procedure: update_review
CREATE OR REPLACE FUNCTION update_review(
    p_client_id INTEGER,
    p_trainer_id INTEGER,
    p_review_text TEXT,
    p_rating INTEGER
)
RETURNS TEXT AS $$
BEGIN
    -- Проверка рейтинга
    IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
        RETURN 'Рейтинг должен быть от 1 до 5';
    END IF;

    -- Проверка длины текста
    IF p_review_text IS NOT NULL AND length(p_review_text) > 300 THEN
        RETURN 'Текст отзыва не должен превышать 300 символов';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM "Review"
        WHERE "ClientId" = p_client_id AND "TrainerId" = p_trainer_id
    ) THEN
        RETURN 'Отзыв не найден';
    END IF;

    UPDATE "Review"
    SET "ReviewText" = NULLIF(p_review_text, ''),
        "Rating" = p_rating
    WHERE "ClientId" = p_client_id AND "TrainerId" = p_trainer_id;

    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Procedure: delete_review
CREATE OR REPLACE FUNCTION delete_review(
    p_client_id INTEGER,
    p_trainer_id INTEGER
)
RETURNS TEXT AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "Review"
        WHERE "ClientId" = p_client_id AND "TrainerId" = p_trainer_id
    ) THEN
        RETURN 'Отзыв не найден';
    END IF;

    DELETE FROM "Review"
    WHERE "ClientId" = p_client_id AND "TrainerId" = p_trainer_id;

    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_review_statistics
CREATE OR REPLACE FUNCTION get_review_statistics()
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
    SELECT json_build_object(
        'totalReviews', COUNT(*),
        'avgRating', ROUND(AVG("Rating")::numeric, 1)
    ) INTO result
    FROM "Review";
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_clients_for_reviews_dictionary
CREATE OR REPLACE FUNCTION get_clients_for_reviews_dictionary()
RETURNS TABLE("ClientId" INTEGER, "FullName" VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT c."ClientId", c."FullName"
    FROM "Client" c
    ORDER BY c."FullName" ASC;
END;
$$ LANGUAGE plpgsql;

-- Procedure: get_trainers_for_reviews_dictionary
CREATE OR REPLACE FUNCTION get_trainers_for_reviews_dictionary()
RETURNS TABLE("TrainerId" INTEGER, "FullName" VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT t."TrainerId", t."FullName"
    FROM "Trainer" t
    ORDER BY t."FullName" ASC;
END;
$$ LANGUAGE plpgsql;
