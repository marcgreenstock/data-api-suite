export const jsTemplate = (): string => 
`exports.up = async (helper, migration) => {
  const transaction = await helper.beginTransaction()
  try {
    await transaction.executeStatement({ sql: 'CREATE TABLE' })
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

exports.down = async (helper, migration) => {
  const t = await helper.beginTransaction()
  try {
    await t.executeStatement({ sql: 'DROP TABLE' })
    await t.commit()
  } catch (error) {
    await t.rollback()
    throw error
  }
}
`

export const tsTemplate = (): string => 
`import { MigrationFn } from 'data-api-migrations'

export const up: MigrationFn = async (helper, migration) => {
  const t = await helper.beginTransaction()
  try {
    await t.executeStatement({ sql: 'CREATE TABLE' })
    await t.commit()
  } catch (error) {
    await t.rollback()
    throw error
  }
}

export const down: MigrationFn = async (helper, migration) => {
  const t = await helper.beginTransaction()
  try {
    await t.executeStatement({ sql: 'DROP TABLE' })
    await t.commit()
  } catch (error) {
    await t.rollback()
    throw error
  }
}
`