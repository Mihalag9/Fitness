CREATE TABLE "Abonnement" (
    "AbonnementId"       SERIAL PRIMARY KEY,
    "AbonnementType"     VARCHAR(100) NOT NULL UNIQUE,
    "Price"              NUMERIC(10, 2) NOT NULL CHECK ("Price" >= 0 AND "Price" <= 100000),
    "DurationMonths"     INTEGER NOT NULL CHECK ("DurationMonths" > 0),
    "AccessStartTime"    TIME NOT NULL DEFAULT '08:00:00',
    "AccessEndTime"      TIME NOT NULL DEFAULT '23:00:00',
    "WeekdayAccess"      BOOLEAN NOT NULL DEFAULT TRUE,   -- доступ в будни
    "WeekendAccess"      BOOLEAN NOT NULL DEFAULT TRUE    -- доступ в выходные
);

CREATE TABLE "WorkoutType" (
    "WorkoutTypeId"   SERIAL PRIMARY KEY,
    "TypeName"        VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE "Gym" (
    "GymId"          SERIAL PRIMARY KEY,
    "GymName"        VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE "Equipment" (
    "EquipmentId"    SERIAL PRIMARY KEY,
    "EquipmentName"  VARCHAR(100) NOT NULL,
    "Brand"          VARCHAR(100),
    "Model"          VARCHAR(100)
);

CREATE TABLE "Trainer" (
    "TrainerId"      SERIAL PRIMARY KEY,
    "FullName"       VARCHAR(200) NOT NULL,
    "Experience"     INTEGER CHECK ("Experience" >= 0)
);

CREATE TABLE "Workout" (
    "WorkoutId"       SERIAL PRIMARY KEY,
    "WorkoutName"     VARCHAR(200) NOT NULL UNIQUE,
    "DurationMinutes" INTEGER NOT NULL CHECK ("DurationMinutes" > 0),
    "MaxParticipants" INTEGER NOT NULL CHECK ("MaxParticipants" > 0)
);

CREATE TABLE "Client" (
    "ClientId"       SERIAL PRIMARY KEY,
    "FullName"       VARCHAR(200) NOT NULL,
    "BirthDate"      DATE,
    "Phone"          VARCHAR(20) NOT NULL UNIQUE,
	
	CONSTRAINT chk_phone_format CHECK ("Phone" ~ '^\+7[0-9]{10}$')
);

CREATE TABLE "Purchase" (
    "ClientId"       INTEGER NOT NULL REFERENCES "Client"("ClientId") ON DELETE CASCADE,
    "AbonnementId"   INTEGER NOT NULL REFERENCES "Abonnement"("AbonnementId") ON DELETE CASCADE,
    "PurchaseDate"   DATE NOT NULL DEFAULT CURRENT_DATE,
    "ExpiryDate"     DATE NOT NULL,
    "Status"         VARCHAR(50) DEFAULT 'активен',

    PRIMARY KEY ("ClientId", "AbonnementId", "PurchaseDate"),
    CHECK ("ExpiryDate" > "PurchaseDate")
);

CREATE TABLE "Inventory" (
    "EquipmentId"    INTEGER NOT NULL REFERENCES "Equipment"("EquipmentId") ON DELETE CASCADE,
    "GymId"          INTEGER NOT NULL REFERENCES "Gym"("GymId") ON DELETE CASCADE,
    "Quantity"       INTEGER NOT NULL DEFAULT 1 CHECK ("Quantity" > 0 AND "Quantity" <= 100),

    PRIMARY KEY ("EquipmentId", "GymId")
);

CREATE TABLE "TrainerRole" (
    "TrainerId"      INTEGER NOT NULL REFERENCES "Trainer"("TrainerId") ON DELETE CASCADE,
    "WorkoutId"      INTEGER NOT NULL REFERENCES "Workout"("WorkoutId") ON DELETE CASCADE,
    "TRole"          VARCHAR(100) NOT NULL DEFAULT 'стажер',

    PRIMARY KEY ("TrainerId", "WorkoutId")
);

CREATE TABLE "Schedule" (
    "ScheduleId"     SERIAL PRIMARY KEY,
    "TrainerId"      INTEGER REFERENCES "Trainer"("TrainerId") ON DELETE SET NULL,
    "WorkoutId"      INTEGER NOT NULL REFERENCES "Workout"("WorkoutId") ON DELETE CASCADE,
    "GymId"          INTEGER NOT NULL REFERENCES "Gym"("GymId") ON DELETE CASCADE,
    "WorkoutTypeId"  INTEGER NOT NULL REFERENCES "WorkoutType"("WorkoutTypeId") ON DELETE CASCADE,
    "WorkDate"       DATE NOT NULL,
    "StartTime"      TIME NOT NULL,
    "EndTime"        TIME NOT NULL,

    CHECK ("EndTime" > "StartTime")
);

CREATE TABLE "Booking" (
    "ClientId"       INTEGER NOT NULL REFERENCES "Client"("ClientId") ON DELETE CASCADE,
    "ScheduleId"     INTEGER NOT NULL REFERENCES "Schedule"("ScheduleId") ON DELETE CASCADE,
    "BookedAt"       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Attended"       BOOLEAN DEFAULT FALSE,

    PRIMARY KEY ("ClientId", "ScheduleId")
);

CREATE TABLE "Review" (
    "ClientId"       INTEGER NOT NULL REFERENCES "Client"("ClientId") ON DELETE CASCADE,
    "TrainerId"      INTEGER NOT NULL REFERENCES "Trainer"("TrainerId") ON DELETE CASCADE,
    "CreatedAt"      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ReviewText"     TEXT,
    "Rating"         INTEGER CHECK ("Rating" BETWEEN 1 AND 5),

    PRIMARY KEY ("ClientId", "TrainerId"),
    CHECK ("ReviewText" IS NOT NULL OR "Rating" IS NOT NULL)
);

CREATE TABLE "GymAllowedWorkout" (
    "GymId"          INTEGER NOT NULL REFERENCES "Gym"("GymId") ON DELETE CASCADE,
    "WorkoutId"      INTEGER NOT NULL REFERENCES "Workout"("WorkoutId") ON DELETE CASCADE,
    
    PRIMARY KEY ("GymId", "WorkoutId")
);