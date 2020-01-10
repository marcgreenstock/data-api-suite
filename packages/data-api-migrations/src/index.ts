import { QueryHelper } from './QueryHelper'
import { Migration } from './Migration'

export * from './MigrationManager'
export type MigrationFn = (helper: QueryHelper, migration: Migration) => Promise<void>
