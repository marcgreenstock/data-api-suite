import * as Serverless from 'serverless'
import * as Plugin from 'serverless/classes/Plugin'
import * as chalk from 'chalk'
import DataAPIMigrations, {
  DataAPIMigrationsConfig
} from 'data-api-migrations'

interface Options extends Serverless.Options {
  name?: string;
}

class DataAPIMigrationsServerless implements Plugin {
  public hooks: Plugin.Hooks
  public commands: Plugin.Commands
  protected options: Options
  protected serverless: Serverless
  protected stage: string

  constructor (serverless: Serverless, options: Options) {
    this.serverless = serverless
    this.options = options

    const commonOptions = {
      stage: {
        usage: 'The stage e.g. (local, dev, staging, prod, etc.)',
        required: false,
        default: 'local'
      }
    }

    this.stage = options.stage || 'local'
    const lifecycleEvents = this.stage === 'local' ? ['init', 'exec', 'end'] : ['exec']

    this.commands = {
      migrations: {
        usage: 'Aurora Serverless DataAPI migration management.',
        lifecycleEvents: ['help'],
        commands: {
          create: {
            usage: 'Generate a new migration file',
            lifecycleEvents: ['generate'],
            options: {
              name: {
                usage: 'Name of the migration e.g. sls migration create --name createUsersTable',
                required: true,
                shortcut: 'n'
              }
            }
          },
          apply: {
            usage: 'Apply all pending migrations.',
            lifecycleEvents,
            options: {
              ...commonOptions
            }
          },
          rollback: {
            usage: 'Rollback the most recent (applied) migration.',
            lifecycleEvents,
            options: {
              ...commonOptions
            }
          },
          status: {
            usage: 'List the migrations that have been applied.',
            lifecycleEvents,
            options: {
              ...commonOptions
            }
          }
        }
      }
    }

    this.hooks = {
      'migrations:create:generate': this.generateMigrationFile.bind(this),
      'migrations:apply:exec': this.applyMigrations.bind(this),
      'migrations:rollback:exec': this.rollbackMigrations.bind(this),
      'migrations:status:exec': this.fetchMigrationStatus.bind(this)
    }
  }

  private manager (): DataAPIMigrations {    
    return new DataAPIMigrations({
      isLocal: this.stage === 'local',
      cwd: this.serverless.config.servicePath,
      logger: this.log.bind(this),
      ...this.config
    })
  }

  private async generateMigrationFile (): Promise<void> {
    const fileName = await this.manager().generateMigration(this.options.name)
    this.log(`${chalk.greenBright(fileName)} created.`)
  }

  private async applyMigrations (): Promise<void> {
    const ids = await this.manager().applyMigrations()
    ids.forEach((id) => this.log(`${chalk.greenBright(id)} applied.`))
  }

  private async rollbackMigrations (): Promise<void> {
    const ids = await this.manager().rollbackMigrations()
    ids.forEach((id) => this.log(`${chalk.greenBright(id)} rolled back.`))
  }

  private async fetchMigrationStatus (): Promise<void> {
    const ids = await this.manager().getAppliedMigrationIds()
    ids.forEach((id) => this.log(`${chalk.greenBright(id)} is applied.`))
  }

  private get config (): DataAPIMigrationsConfig {
    const baseConfig = this.serverless.service.custom['DataAPIMigrations']
    if (baseConfig === undefined) {
      throw new Error('"custom"."DataAPIMigrations" is missing from serverless.yml')
    }
    const {
      migrationsFolder = './migrations',
      typescript = true,
      [this.stage]: dataAPI
    } = baseConfig
    if (dataAPI === undefined) {
      throw new Error(`"custom"."DataAPIMigrations"."${this.stage}" is missing from serverless.yml`)
    }
    return {
      migrationsFolder,
      typescript,
      dataAPI
    }
  }

  private log (message: string): void {
    this.serverless.cli.log(`${chalk.magentaBright('Data API Migrations:')} ${message}`)
  }
}

export = DataAPIMigrationsServerless
