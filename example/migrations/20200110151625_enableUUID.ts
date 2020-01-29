import { MigrationFn } from 'data-api-migrations'

export const up: MigrationFn = async (dataAPI) => {
  const t = await dataAPI.beginTransaction()
  try {
    await t.query('create extension "uuid-ossp"')
    await t.commit()
  } catch (error) {
    await t.rollback()
    throw error
  }
}

export const down: MigrationFn = async (dataAPI) => {
  const t = await dataAPI.beginTransaction()
  try {
    await t.query('drop extension "uuid-ossp"')
    await t.commit()
  } catch (error) {
    await t.rollback()
    throw error
  }
}
