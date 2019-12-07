import {
  ClientConfig as PostgresClientConfig,
  Client as PostgresClient
} from 'pg'
import {
  ConnectionConfig as MySQLConnectionConfig,
  Connection as MySQLConnection
} from 'mysql'
import * as express from 'express'
import * as URL from 'url'

const DEFAULT_PORT = 8080
const DEFAULT_HOSTNAME = 'localhost'

const getEngineFromUrl = (urlString: string): 'mysql' | 'postgres' | undefined => {
  try {
    const url = URL.parse(urlString)
    if (/mysql:$/.test(url.protocol)) {
      return 'mysql'
    } else if (/postgres:$/.test(url.protocol)) {
      return 'postgres'
    }
  } catch (_e) {
    return undefined
  }
}

namespace DataAPILocal {
  export type Url = string

  export interface ServerConfig {
    hostname?: string
    port?: number
  }

  export interface MySQLConnectionOptions extends MySQLConnectionConfig {
    engine: 'mysql'
  }

  export interface PostgresConnectionOptions extends PostgresClientConfig {
    engine: 'postgres'
  }

  export interface UrlConnectionOptions {
    url: Url
  }

  export type ConnectionOptions = UrlConnectionOptions | MySQLConnectionOptions | PostgresConnectionOptions

  export class Client {
    protected client: PostgresClient | MySQLConnection
    protected app: express.Express
    protected logger: Console

    constructor ({ logger = console }: { logger?: Console }) {
      this.logger = logger
      this.app = express()
      this.app.get('/foobar', this.handleStatement.bind(this))
    }

    async connect (options: ConnectionOptions): Promise<void> {
      if ('url' in options) {
        const engine = getEngineFromUrl(options.url)
        switch (engine) {
          case 'mysql':
            await this.connectMySQL(options.url)
            break
          case 'postgres':
            await this.connectPostgreSQL(options.url)
            break
          default:
            throw new Error(`Engine can not be determined from url: "${options.url}"`)
        }
      } else if ('engine' in options) {
        const { engine, ...rest } = options
        switch (engine) {
          case 'mysql':
            await this.connectMySQL(rest as MySQLConnectionConfig)
            break
          case 'postgres':
            await this.connectPostgreSQL(rest as PostgresClientConfig)
            break
          default:
            throw new Error(`Unsuported engine: "${engine}"`)
        }
      } else {
        throw new Error('"url" or "engine" is required.')
      }
    }

    async connectMySQL (config: string | MySQLConnectionConfig): Promise<MySQLConnection> {
      const { createConnection } = await import('mysql')
      this.client = createConnection(config)
      await new Promise((resolve, reject) => {
        this.client.connect((error) => {
          if (error) { reject(error) }
          resolve()
        })
      })
      return this.client
    }

    async connectPostgreSQL (config: string | PostgresClientConfig): Promise<PostgresClient> {
      const { Client } = await import('pg')
      this.client = new Client(config)
      await this.client.connect()
      return this.client
    }

    async listen ({ hostname = DEFAULT_HOSTNAME, port = DEFAULT_PORT }: ServerConfig): Promise<void> {
      return new Promise((resolve) => {
        this.app.listen(port, hostname, () => {
          if(this.logger !== undefined) {
            this.logger.info(`DataAPILocal listening on http://${hostname}:${port}`)
          }
          resolve()
        })
      })
    }

    async end () {
      await this.client.end()
    }

    handleStatement (req: express.Request, res: express.Response) {
      res.status(200).json({hello: 'world'})
    }
  }

  export const dataApiLocal = async (
    options: ConnectionOptions & {
      server?: ServerConfig
      logger?: Console,
      logLevel?: string
    }
  ): Promise<Client> => {
    const { logger, server, ...dbConfig } = options
    const client = new Client({ logger })
    await Promise.all([
      client.connect(dbConfig),
      client.listen(server)
    ])
    return client
  }
}

export = DataAPILocal
