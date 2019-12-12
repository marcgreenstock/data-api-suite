CREATE TABLE "test" (
  "id" SERIAL PRIMARY KEY,
  "nonNullString" character varying NOT NULL,
  "nullString" character varying,
  "timestampWithoutTZ" timestamp without time zone,
  "timestampWithTZ" timestamp with time zone,
  "integer" integer
);
INSERT INTO "test" ("nonNullString", "nullString", "integer")
  VALUES ('foobar', 'example', 42);
