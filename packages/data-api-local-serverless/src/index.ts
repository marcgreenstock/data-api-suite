import * as Serverless from 'serverless'
import * as Plugin from 'serverless/classes/Plugin'
import { dataApiLocal, Server, ServerOptions } from 'data-api-local'

class DataAPILocalServerless implements Plugin {
  public hooks: Plugin.Hooks
  protected serverless: Serverless
  protected server: Server

  constructor (serverless: Serverless) {
    this.serverless = serverless

    this.hooks = {
      'before:offline:start:init': this.startHandler.bind(this),
      'before:offline:start:end': this.endHandler.bind(this)
    }
  }

  private get config (): ServerOptions {
    return this.serverless.service.custom['data-api-local'] || {}
  }

  private async startHandler (): Promise<void> {
    this.server = await dataApiLocal(this.config)
  }

  private async endHandler (): Promise<void> {
    await this.server.stop()
  }
}

export = DataAPILocalServerless
