import {
  Client,
  MySQLClient,
  PostgresClient,
  MysqlClientConfig,
  PostgresClientConfig,
} from './Client'
import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as URL from 'url'
import * as http from 'http'
import * as uuid from 'uuid/v4'

const DEFAULT_PORT = 8080
const DEFAULT_HOSTNAME = 'localhost'

const parseUrl = (urlString: string): MySQLConnectionOptions | PostgresConnectionOptions => {
  const url = URL.parse(urlString)
  let engine: engines
  if (/mysql:$/.test(url.protocol)) {
    engine = 'mysql'
  } else if (/postgres:$/.test(url.protocol)) {
    engine = 'postgres'
  }
  const host = url.hostname !== null ? url.hostname : undefined
  const port = url.port !== null ? parseInt(url.port) : undefined
  const [user, password] = url.auth !== null ? url.auth.split(':') : [undefined, undefined]
  const database = url.path !== null ? url.path : undefined
  return {
    engine,
    port,
    host,
    user,
    password,
    database
  }
}

export type engines = 'mysql' | 'postgres'

export type Url = string

export interface ServerConfig {
  hostname?: string
  port?: number
}

export interface MySQLConnectionOptions extends MysqlClientConfig {
  engine: 'mysql'
}

export interface PostgresConnectionOptions extends PostgresClientConfig {
  engine: 'postgres'
}

export interface UrlConnectionOptions {
  url: Url
}

export type DbConfig = UrlConnectionOptions | MySQLConnectionOptions | PostgresConnectionOptions

export type ServerOptions = DbConfig & {
  server?: ServerConfig
  logger?: Console,
  logLevel?: 'INFO' | 'DEBUG' | 'WARN'
}

export class Server {
  protected app: express.Express
  protected httpServer: http.Server
  protected port: number
  protected hostname: string
  protected logger: Console
  protected engine: engines
  protected dbConfig: MySQLConnectionOptions | PostgresConnectionOptions
  protected pool: {[transactionId: string]: Client}

  constructor ({
    logger = console,
    logLevel = 'INFO',
    server,
    ...dbConfig
  }: ServerOptions) {
    this.logger = logger
    this.port = server.port || DEFAULT_PORT
    this.hostname = server.hostname || DEFAULT_HOSTNAME
    this.dbConfig = 'url' in dbConfig ? parseUrl(dbConfig.url) : dbConfig
    this.pool = {}
    this.app = express()
    this.app.use(bodyParser.json())
    this.app.post('/Execute', this.execute.bind(this))
    // this.app.post('/BatchExecute', this.batchExecute.bind(this))
    // this.app.post('/ExecuteSql', this.executeSql.bind(this))
    this.app.post('/BeginTransaction', this.beginTransaction.bind(this))
    this.app.post('/CommitTransaction', this.commitTransaction.bind(this))
    this.app.post('/RollbackTransaction', this.rollbackTransaction.bind(this))
  }

  public async start (): Promise<Server> {
    await new Promise((resolve) => {
      this.httpServer = this.app.listen(this.port, this.hostname, () => {
        this.log(`DataAPILocal listening on http://${this.hostname}:${this.port}`)
        resolve()
      })
    })
    return this
  }

  public async stop (): Promise<void> {
    await Promise.all(Object.values(this.pool).map((client) => client.disconnect()))
    return new Promise((resolve, reject) => {
      this.httpServer.close((error) => {
        if (error) { return reject(error) }
        resolve()
      })
    })
  }

  private log (message: string): void {
    if (this.logger !== undefined) {
      this.logger.info(message)
    }
  }

  private getClient ({
    transactionId
  }: {
    transactionId: string
  }): Client | undefined {
    return this.pool[transactionId]
  }

  private async createClient ({
    database = this.dbConfig.database,
    transactionId
  }: {
    database?: string,
    transactionId?: string
  }): Promise<Client> {
    const { engine, ...config } = this.dbConfig
    let client: Client
    if (engine === 'mysql') {
      client = await new MySQLClient({ ...config as MysqlClientConfig, database }).connect()
    } else if (engine === 'postgres') {
      client = await new PostgresClient({...config as PostgresClientConfig, database }).connect()
    }
    if (transactionId !== undefined) {
      this.pool[transactionId] = client
    }
    return client
  }

  private async destroyClient ({
    transactionId,
    client
  }: {
    transactionId: string,
    client: Client
  }): Promise<void> {
    await client.disconnect()
    if (transactionId) {
      delete this.pool[transactionId]
    }
  }

  private async execute (
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    let client: Client
    const { transactionId, sql, parameters, database } = req.body
    if (transactionId !== undefined) {
      client = this.getClient({ transactionId })
    } else {
      client = await this.createClient({ database })
    }
    try {
      const result = await client.query({ sql, parameters })
      res.status(200).json(result)
    } catch (error) {
      res.status(400).json(error)
    }
    if (transactionId === undefined) {
      await this.destroyClient({ client, transactionId })
    }
  }

  private async beginTransaction (
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    const transactionId = Buffer.from(uuid()).toString('base64')
    const { database } = req.body
    const client = await this.createClient({ database, transactionId })
    await client.beginTransaction()
    res.status(200).json({ transactionId })
  }

  private async commitTransaction (
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    const { transactionId } = req.body
    const client = this.getClient({ transactionId })
    if (client === undefined) {
      res.send(404)
    } else {
      await client.commitTransaction()
      res.status(200).json({ transactionStatus: 'Transaction Committed' })
      await this.destroyClient({ client, transactionId })
    }
  }

  private async rollbackTransaction (
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    const { transactionId } = req.body
    const client = this.getClient({ transactionId })
    if (client === undefined) {
      res.send(404)
    } else {
      await client.rollbackTransaction()
      res.status(200).json({ transactionStatus: 'Transaction Rolledback' })
      await this.destroyClient({ client, transactionId })
    }
  }
}
