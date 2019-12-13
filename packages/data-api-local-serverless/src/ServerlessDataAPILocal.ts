import * as Serverless from 'serverless'
import * as Plugin from 'serverless/classes/Plugin'
import * as DataAPILocal from 'data-api-local'

class ServerlessDataAPILocal {
  protected serverless: Serverless
  protected options: Serverless.Options
  protected hooks: Plugin.Hooks
  protected commands: Plugin.Commands
  protected server: DataAPILocal.Server

  constructor (serverless: Serverless, options: Serverless.Options) {
    this.serverless = serverless
    this.options = options

    this.hooks = {
      'before:offline:start:init': this.startHandler.bind(this),
      'before:offline:start:end': this.endHandler.bind(this)
    }
  }

  private get config (): DataAPILocal.ServerOptions {
    if (this.serverless.service.custom !== undefined &&
        this.serverless.service.custom['data-api-local'] !== undefined
    ) {
      return this.serverless.service.custom['data-api-local']
    }
  }

  private async startHandler (): Promise<void> {
    this.server = await DataAPILocal.dataApiLocal(this.config)
  }

  private async endHandler (): Promise<void> {
    await this.server.stop()
  }
}

export default ServerlessDataAPILocal
