import { MigrationFn } from 'data-api-migrations'

export const up: MigrationFn = async (dataAPI) => {
  const t = await dataAPI.beginTransaction()
  try {
    await t.query(`
      CREATE TABLE "todos" (
        "id" uuid DEFAULT uuid_generate_v1() PRIMARY KEY,
        "name" varchar,
        "completedAt" timestamp,
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now()
      )
    `)
    await t.commit()
  } catch (error) {
    await t.rollback()
    throw error
  }
}

export const down: MigrationFn = async (dataAPI) => {
  const t = await dataAPI.beginTransaction()
  try {
    await t.query('DROP TABLE "todos"')
    await t.commit()
  } catch (error) {
    await t.rollback()
    throw error
  }
}
