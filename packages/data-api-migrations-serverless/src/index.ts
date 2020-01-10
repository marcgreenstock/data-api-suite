import * as Serverless from 'serverless'
import * as Plugin from 'serverless/classes/Plugin'
import * as chalk from 'chalk'
import {
  MigrationManager, 
  MigrationManagerClientConfig, 
  MigrationManagerMethodConfig 
} from 'data-api-migrations'

interface Config {
  destName?: string;
  typescript?: boolean;
  clientConfig?: MigrationManagerClientConfig;
  methodConfig?: MigrationManagerMethodConfig;
}

interface Options extends Serverless.Options {
  name?: string;
  limit?: string;
  id?: string;
  toId?: string;
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
      // 'migration:help': (): Promise<void> => {
      //   this.serverless.cli.generateCommandsHelp(['migration'])
      //   return Promise.resolve()
      // },
      'migrations:create:generate': this.generateMigrationFile.bind(this),
      'migrations:apply:exec': this.applyMigrations.bind(this),
      'migrations:rollback:exec': this.rollbackMigrations.bind(this),
      'migrations:status:exec':this.fetchMigrationStatus.bind(this)
    }
  }

  private manager (): MigrationManager {    
    return new MigrationManager({
      isLocal: this.stage === 'local',
      cwd: this.serverless.config.servicePath,
      logger: this.log.bind(this),
      destName: this.config.destName,
      typescript: this.config.typescript,
      clientConfig: this.config.clientConfig,
      methodConfig: this.config.methodConfig
    })
  }

  private async generateMigrationFile (): Promise<void> {
    this.manager().generateMigration(this.options.name)
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

  private get config (): Config {
    const baseConfig = this.serverless.service.custom['data-api-migrations']
    if (baseConfig === undefined) {
      throw new Error('"custom"."data-api-migrations" is missing from serverless.yml')
    }
    const stageConfig = baseConfig[this.stage]
    if (stageConfig === undefined) {
      throw new Error(`"custom"."data-api-migrations"."${this.stage}" is missing from serverless.yml`)
    }
    return {
      destName: './migrations',
      typescript: true,
      ...stageConfig
    }
  }

  private log (message: string): void {
    this.serverless.cli.log(`${chalk.magentaBright('Data API Migrations:')} ${message}`)
  }
}

export = DataAPIMigrationsServerless
