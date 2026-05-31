
CREATE OR REPLACE FUNCTION get_bookings_by_schedule(
    p_schedule_id INTEGER,
    p_client_name VARCHAR DEFAULT NULL,
    p_attended BOOLEAN DEFAULT NULL
)
RETURNS TABLE(
    "ClientId" INTEGER,
    "ClientName" VARCHAR,
    "BookedAt" TIMESTAMP,
    "Attended" BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT b."ClientId", c."FullName", b."BookedAt", b."Attended"
    FROM "Booking" b
    JOIN "Client" c ON b."ClientId" = c."ClientId"
    WHERE b."ScheduleId" = p_schedule_id
      AND (p_client_name IS NULL OR c."FullName" ILIKE '%' || p_client_name || '%')
      AND (p_attended IS NULL OR b."Attended" = p_attended)
    ORDER BY b."BookedAt" DESC;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION add_booking(
    p_client_id INTEGER,
    p_schedule_id INTEGER
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO "Booking" ("ClientId", "ScheduleId")
    VALUES (p_client_id, p_schedule_id);

    RETURN 'Клиент "' ||
        (SELECT "FullName" FROM "Client" WHERE "ClientId" = p_client_id) ||
        '" успешно записан на занятие';
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION delete_booking(
    p_client_id INTEGER,
    p_schedule_id INTEGER
)
RETURNS TEXT AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "Booking"
        WHERE "ClientId" = p_client_id AND "ScheduleId" = p_schedule_id
    ) THEN
        RETURN 'Запись не найдена';
    END IF;

    DELETE FROM "Booking"
    WHERE "ClientId" = p_client_id AND "ScheduleId" = p_schedule_id;

    RETURN 'Запись клиента "' ||
        (SELECT "FullName" FROM "Client" WHERE "ClientId" = p_client_id) ||
        '" успешно удалена';
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION toggle_attended(
    p_client_id INTEGER,
    p_schedule_id INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_current BOOLEAN;
BEGIN
    SELECT "Attended" INTO v_current
    FROM "Booking"
    WHERE "ClientId" = p_client_id AND "ScheduleId" = p_schedule_id;

    IF v_current IS NULL THEN
        RETURN 'Запись не найдена';
    END IF;

    UPDATE "Booking"
    SET "Attended" = NOT v_current
    WHERE "ClientId" = p_client_id AND "ScheduleId" = p_schedule_id;

    IF v_current THEN
        RETURN 'Отметка посещения снята';
    ELSE
        RETURN 'Клиент отмечен как посетивший';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_clients_dictionary_for_booking()
RETURNS TABLE("ClientId" INTEGER, "FullName" VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT c."ClientId", c."FullName"
    FROM "Client" c
    ORDER BY c."FullName" ASC;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_booking_stats(p_schedule_id INTEGER)
RETURNS JSON AS $$
DECLARE
    result JSON;
    v_max INTEGER;
    v_booked INTEGER;
BEGIN
    SELECT w."MaxParticipants" INTO v_max
    FROM "Schedule" s
    JOIN "Workout" w ON s."WorkoutId" = w."WorkoutId"
    WHERE s."ScheduleId" = p_schedule_id;

    SELECT COUNT(*) INTO v_booked
    FROM "Booking"
    WHERE "ScheduleId" = p_schedule_id;

    SELECT json_build_object(
        'bookedCount', v_booked,
        'maxParticipants', v_max
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;
