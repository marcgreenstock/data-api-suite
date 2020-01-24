import * as Serverless from 'serverless'
import * as Plugin from 'serverless/classes/Plugin'
import * as chalk from 'chalk'
import { dataApiLocal, Server, ServerOptions } from 'data-api-local'

class DataAPILocalServerless implements Plugin {
  public hooks: Plugin.Hooks
  protected serverless: Serverless
  protected server: Server

  constructor (serverless: Serverless) {
    this.serverless = serverless

    const startHandler = this.startHandler.bind(this)
    const endHandler = this.endHandler.bind(this)

    this.hooks = {
      'before:offline:start:init': startHandler,
      'before:offline:start:end': endHandler,
      'before:migrations:status:init': startHandler,
      'after:migrations:status:end': endHandler,
      'before:migrations:apply:init': startHandler,
      'after:migrations:apply:end': endHandler,
      'before:migrations:rollback:init': startHandler,
      'after:migrations:rollback:end': endHandler
    }
  }

  private get config (): ServerOptions {
    const custom = this.serverless.service.custom
    return {
      ...(custom['data-api-local'] || custom['DataAPILocal']),
      logger: this.log.bind(this)
    }
  }

  private async startHandler (): Promise<void> {
    this.log('Starting server...')
    this.server = await dataApiLocal(this.config)
  }

  private async endHandler (): Promise<void> {
    this.log('Stopping server...')
    await this.server.stop()
  }

  private log(message: string): void {
    this.serverless.cli.log(`${chalk.blueBright('Data API Local:')} ${message}`)
  }
}

export = DataAPILocalServerless
