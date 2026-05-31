-- Представление продаж с именами клиентов и названиями абонементов
CREATE OR REPLACE VIEW vw_purchase_display AS
SELECT 
    p."ClientId",
    c."FullName" AS "ClientName",
    p."AbonnementId",
    a."AbonnementType",
    a."DurationMonths",
    p."PurchaseDate",
    p."ExpiryDate",
    p."Status"
FROM "Purchase" p
JOIN "Client" c ON p."ClientId" = c."ClientId"
JOIN "Abonnement" a ON p."AbonnementId" = a."AbonnementId";
