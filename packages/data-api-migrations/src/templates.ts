/* eslint-disable prettier/prettier */
export const jsTemplate = (): string => `
exports.up = async (dataAPI, migration) => {
  const transaction = await dataAPI.beginTransaction()
  try {
    await transaction.executeStatement({ sql: 'CREATE TABLE' })
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

exports.down = async (dataAPI, migration) => {
  const t = await dataAPI.beginTransaction()
  try {
    await t.executeStatement({ sql: 'DROP TABLE' })
    await t.commit()
  } catch (error) {
    await t.rollback()
    throw error
  }
}
`.trimLeft()

export const tsTemplate = (): string => `
import { MigrationFn } from 'data-api-migrations'

export const up: MigrationFn = async (dataAPI, migration) => {
  const t = await dataAPI.beginTransaction()
  try {
    await t.executeStatement({ sql: 'CREATE TABLE' })
    await t.commit()
  } catch (error) {
    await t.rollback()
    throw error
  }
}

export const down: MigrationFn = async (dataAPI, migration) => {
  const t = await dataAPI.beginTransaction()
  try {
    await t.executeStatement({ sql: 'DROP TABLE' })
    await t.commit()
  } catch (error) {
    await t.rollback()
    throw error
  }
}
`.trimLeft()
