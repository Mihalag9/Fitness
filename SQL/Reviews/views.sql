-- View: vw_review_display
-- Представление отзывов с именами клиентов и тренеров
CREATE OR REPLACE VIEW vw_review_display AS
SELECT 
    r."ClientId",
    c."FullName" AS "ClientName",
    r."TrainerId",
    t."FullName" AS "TrainerName",
    r."CreatedAt",
    r."ReviewText",
    r."Rating"
FROM "Review" r
JOIN "Client" c ON r."ClientId" = c."ClientId"
JOIN "Trainer" t ON r."TrainerId" = t."TrainerId";
