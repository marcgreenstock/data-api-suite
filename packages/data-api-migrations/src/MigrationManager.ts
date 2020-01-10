import * as path from 'path'
import * as fs from 'fs-extra'
import * as _ from 'lodash'
import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { format as formatDate } from 'date-fns'
import { jsTemplate, tsTemplate } from './templates'
import { Migration } from './Migration'
import { TsCompiler } from './TsCompiler'
import { Compiler, CompilerDerived } from './Compiler'
import { QueryHelper, QueryHelperMethodConfig } from './QueryHelper'

const ID_FORMAT = 'yyyyMMddHHmmss'

export type MigrationManagerClientConfig = RDSDataService.ClientConfiguration
export type MigrationManagerMethodConfig = QueryHelperMethodConfig
export interface MigrationManagerOptions {
  cwd?: string;
  destName?: string;
  typescript?: boolean;
  logger?: Function;
  compiler?: CompilerDerived;
  isLocal: boolean;
  clientConfig?: MigrationManagerClientConfig;
  methodConfig?: MigrationManagerMethodConfig;
}

export class MigrationManager {
  public readonly cwd: string
  public readonly typescript: boolean
  public readonly isLocal: boolean
  protected logger: Function
  protected compiler: CompilerDerived
  protected migrationsPath: string
  protected buildPath: string
  protected queryHelper: QueryHelper

  constructor ({
    cwd,
    destName,
    typescript,
    logger,
    compiler,
    isLocal,
    clientConfig,
    methodConfig
  }: MigrationManagerOptions) {
    this.logger = logger
    this.cwd = cwd = cwd === undefined ? process.cwd() : cwd
    this.typescript = typescript === undefined ? true : typescript
    this.compiler = compiler === undefined ? TsCompiler : compiler
    this.isLocal = isLocal === undefined ? false : isLocal
    this.migrationsPath = path.join(this.cwd, destName)
    this.buildPath = path.join(this.cwd, '.migrations_build')
    this.queryHelper = new QueryHelper({
      clientConfig,
      methodConfig,
      logger: this.log.bind(this)
    })
  }

  public async generateMigration (name: string): Promise<string> {
    name = _.camelCase(name)
    const id = formatDate(new Date(), ID_FORMAT)
    const template = this.typescript ? tsTemplate : jsTemplate
    const ext = this.typescript ? 'ts' : 'js'
    const fileName = `${id}_${name}.${ext}`
    const filePath = path.join(this.migrationsPath, fileName)
    await fs.writeFile(filePath, template())
    return filePath
  }

  public async getAppliedMigrationIds (): Promise<number[]> {
    await this.ensureMigrationTable()
    const result = await this.queryHelper.executeStatement({
      sql: 'SELECT id FROM __migrations__',
    })
    return result.records.map((record) => {
      return record[0].longValue
    })
  }

  public async applyMigrations (): Promise<number[]> {
    const [migrations, compiler] = await this.bootstrap()
    const migrationsToRun = migrations.filter((migration) => !migration.isApplied)
    try {
      for (let i = 0; i < migrationsToRun.length; i ++) {
        this.log(`Applying ${migrationsToRun[i].id} - ${migrationsToRun[i].name}`)
        await migrationsToRun[i].apply()
      }
      return migrationsToRun.map((migration) => migration.id)
    } finally {
      await compiler.cleanup()
    }
  }

  public async rollbackMigrations (): Promise<number[]> {
    const [migrations, compiler] = await this.bootstrap()
    const migrationsToRun = migrations.filter((migration) => migration.isApplied).slice(-1, migrations.length)
    try {
      for (let i = 0; i < migrationsToRun.length; i++) {
        this.log(`Rolling back ${migrationsToRun[i].id} - ${migrationsToRun[i].name}`)
        await migrationsToRun[i].rollback()
      }
      return migrationsToRun.map((migration) => migration.id)
    } finally {
      await compiler.cleanup()
    }
  }

  private async bootstrap (): Promise<[Migration[], Compiler]> {
    const compiler = new this.compiler({
      cwd: this.cwd,
      migrationsPath: this.migrationsPath,
      buildPath: this.buildPath,
      logger: this.log.bind(this)
    })
    const appliedMigrationIds = await this.getAppliedMigrationIds()
    const files = await compiler.compile()
    const migrations = 
      files
      .map((file) => {
        const fileName = path.basename(file, '.js')
        const match = fileName.match(/^(?<id>\d{14})_(?<name>\w+)/)
        if (!match || !match.groups || !match.groups.id || !match.groups.name) {
          return null
        } else {
          const id = parseInt(match.groups.id)
          const name = match.groups.name
          return { id, name, file }
        }
      })
      .filter((data) => data !== null)
      .sort((a, b) => a.id - b.id)
      .map(({ id, ...data }) => new Migration({ 
        id,
        ...data,
        queryHelper: this.queryHelper, 
        isLocal: this.isLocal,
        isApplied: appliedMigrationIds.includes(id)
      }))
    return [migrations, compiler]
  }

  private async ensureMigrationTable (): Promise<void> {
    await this.queryHelper.executeStatement({
      sql: 'CREATE TABLE IF NOT EXISTS __migrations__ (id bigint NOT NULL UNIQUE)'
    })
  }

  private log (message: string): void {
    if (typeof this.logger === 'function') {
      this.logger(message)
    }
  }
}