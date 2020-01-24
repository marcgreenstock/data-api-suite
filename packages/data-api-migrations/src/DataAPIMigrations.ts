import * as path from 'path'
import * as fs from 'fs-extra'
import * as _ from 'lodash'
import * as AuroraDataAPI from 'aurora-data-api'
import { format as formatDate } from 'date-fns'
import { jsTemplate, tsTemplate } from './templates'
import { Migration } from './Migration'
import { TypeScriptCompiler } from './TypeScriptCompiler'
import { Compiler, CompilerDerived } from './Compiler'

const ID_FORMAT = 'yyyyMMddHHmmss'

export interface DataAPIMigrationsConfig {
  cwd?: string;
  migrationsFolder?: string;
  typescript?: boolean;
  logger?: Function;
  compiler?: CompilerDerived;
  isLocal?: boolean;
  dataAPI: AuroraDataAPI.AuroraDataAPIConfig;
}

export class DataAPIMigrations {
  public readonly cwd: string
  public readonly typescript: boolean
  public readonly isLocal: boolean
  public readonly dataAPI: AuroraDataAPI
  protected logger: Function
  protected compiler: CompilerDerived
  protected migrationsPath: string
  protected buildPath: string

  constructor ({
    cwd,
    migrationsFolder,
    typescript,
    logger,
    compiler,
    isLocal,
    dataAPI
  }: DataAPIMigrationsConfig) {
    this.logger = logger
    this.cwd = cwd = cwd || process.cwd()
    this.typescript = typescript === undefined ? true : typescript
    this.compiler = compiler || TypeScriptCompiler
    this.isLocal = isLocal === undefined ? false : isLocal
    this.migrationsPath = path.join(this.cwd, migrationsFolder || 'migrations')
    this.buildPath = path.join(this.cwd, '.migrations_build')
    this.dataAPI = new AuroraDataAPI(dataAPI)
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

  public async getAppliedMigrationIds (): Promise<string[]> {
    await this.ensureMigrationTable()
    const result = await this.dataAPI.query<{id: string}>('SELECT id FROM __migrations__')
    return result.rows.map((row) => row.id)
  }

  public async applyMigrations (): Promise<string[]> {
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

  public async rollbackMigrations (): Promise<string[]> {
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
          const id = match.groups.id
          const name = match.groups.name
          return { id, name, file }
        }
      })
      .filter((data) => data !== null)
      .sort((a, b) => parseInt(a.id) - parseInt(b.id))
      .map(({ id, ...data }) => new Migration({
        id,
        ...data,
        dataAPI: this.dataAPI,
        isLocal: this.isLocal,
        isApplied: appliedMigrationIds.includes(id)
      }))
    return [migrations, compiler]
  }

  private async ensureMigrationTable (): Promise<void> {
    await this.dataAPI.query(
      'CREATE TABLE IF NOT EXISTS __migrations__ (id varchar NOT NULL UNIQUE)',
      undefined,
      { includeResultMetadata: false }
    )
  }

  private log (message: string): void {
    if (typeof this.logger === 'function') {
      this.logger(message)
    }
  }
}

export default DataAPIMigrations