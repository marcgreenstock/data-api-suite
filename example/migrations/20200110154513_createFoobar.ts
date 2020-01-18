import { MigrationFn } from 'data-api-migrations'

export const up: MigrationFn = async (dataAPI) => {
  const t = await dataAPI.beginTransaction();
  try {
    await t.executeStatement({
      sql: `
        CREATE TABLE foobar (
          id SERIAL PRIMARY KEY,
          name character varying,
          "createdAt" TIMESTAMP DEFAULT now(),
          "completedAt" TIMESTAMP
      )
      `
    })
    await t.commit()
  } catch (error) {
    await t.rollback()
    throw error
  }
}

export const down: MigrationFn = async (dataAPI) => {
  const t = await dataAPI.beginTransaction()
  try {
    await t.executeStatement({ sql: 'DROP TABLE foobar' })
    await t.commit()
  } catch (error) {
    await t.rollback()
    throw error
  }
}
