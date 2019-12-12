import { Client, ClientConfig } from 'pg'
import * as uuid from 'uuid/v4'

export const setupDatabase = async (config: string | ClientConfig): Promise<string> => {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'foobar'
  })
  const tableName = uuid()
  const dbName = uuid()
  await client.connect()

  try {
    await client.query({
      text: `
        DROP DATABASE IF EXISTS "${dbName}";
        CREATE DATABASE "${dbName}";
      `
    })
  } catch (error) {
    console.log(error)
    return 'fuck'
  }

  // await client.query({
  //   text: `
  //     CREATE DATABASE "whatever";

  //     DROP TABLE IF EXISTS "${tableName}";

      // CREATE TABLE "${tableName}" (
      //   "id" SERIAL PRIMARY KEY,
      //   "nonNullString" character varying NOT NULL,
      //   "nullString" character varying,
      //   "timestampWithoutTZ" timestamp without time zone,
      //   "timestampWithTZ" timestamp with time zone,
      //   "integer" integer
      // );

  //     INSERT INTO "${tableName}"
  //       ("nonNullString", "nullString", "integer")
  //       VALUES
  //       ('foobar', 'whatever', 43);
  //   `
  // })
  await client.end()
  return tableName
}
