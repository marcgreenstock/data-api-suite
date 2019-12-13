import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as http from 'http'
import * as uuid from 'uuid/v4'
import * as yup from 'yup'
import {
  Client,
  QueryError
} from './Client'
import {
  MySQLClient,
  MysqlClientConfig
} from './MySQLClient'
import {
  PostgresClient,
  PostgresClientConfig
} from './PostgresClient'
import { parseUrl } from './utils/parseUrl'
import * as schemas from './schemas'

const DEFAULT_PORT = 8080
const DEFAULT_HOSTNAME = 'localhost'

class NotFoundException extends Error {

}

export type engines = 'mysql' | 'postgres'

export type Url = string

export interface ServerConfig {
  hostname?: string;
  port?: number;
}

export interface MySQLConnectionOptions extends MysqlClientConfig {
  engine: 'mysql';
}

export interface PostgresConnectionOptions extends PostgresClientConfig {
  engine: 'postgres';
}

export interface UrlConnectionOptions {
  url: Url;
}

export type DbConfig = UrlConnectionOptions | MySQLConnectionOptions | PostgresConnectionOptions

export type ServerOptions = DbConfig & {
  server?: ServerConfig;
  logger?: Console;
  logLevel?: 'INFO' | 'DEBUG' | 'WARN';
}

export class Server {
  protected app: express.Express
  protected httpServer: http.Server
  protected port: number
  protected hostname: string
  protected logger: Console
  protected logLevel: string
  protected engine: engines
  protected dbConfig: MySQLConnectionOptions | PostgresConnectionOptions
  protected pool: { [transactionIdOrDatabase: string]: Client }

  constructor ({
    logger = console,
    logLevel = 'INFO',
    server,
    ...dbConfig
  }: ServerOptions) {
    this.logger = logger
    this.logLevel = logLevel
    this.port = server.port || DEFAULT_PORT
    this.hostname = server.hostname || DEFAULT_HOSTNAME
    this.dbConfig = 'url' in dbConfig ? parseUrl(dbConfig.url) : dbConfig
    this.pool = {}
    this.app = express()
    this.app.use(bodyParser.json())
    this.app.post('/Execute', this.executeStatement.bind(this))
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

  private getClient (id: string): Client | undefined {
    return this.pool[id]
  }

  private async createClient ({
    database = this.dbConfig.database,
    transactionId
  }: {
    database?: string;
    transactionId?: string;
  }): Promise<Client> {
    const { engine, ...config } = this.dbConfig
    let client: Client
    if (engine === 'mysql') {
      client = await new MySQLClient({ ...config as MysqlClientConfig, database }).connect()
    } else if (engine === 'postgres') {
      client = await new PostgresClient({ ...config as PostgresClientConfig, database }).connect()
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
    transactionId: string;
    client: Client;
  }): Promise<void> {
    await client.disconnect()
    if (transactionId) {
      delete this.pool[transactionId]
    }
  }

  private async executeStatement (
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const {
        sql,
        database,
        parameters,
        transactionId
      } = await schemas.executeStatementSchema.validate(req.body)
      let client: Client
      if (transactionId !== undefined) {
        if (transactionId in this.pool) {
          client = this.pool[transactionId]
        } else {
          throw new NotFoundException('transactionId not found')
        }
      } else {
        if (database in this.pool) {
          client = this.pool[database]
        } else {
          client = this.pool[database] = await this.createClient({ database })
        }
      }
      const result = await client.query({ sql, parameters })
      if (transactionId === undefined) {
        await this.destroyClient({ client, transactionId })
      }
      res.status(200).json(result)
    } catch (error) {
      console.error(error)
      if (error instanceof yup.ValidationError || error instanceof QueryError) {
        res.status(400).json({ message: error.message })
      } else if (error instanceof NotFoundException) {
        res.status(404).json({ message: error.message })
      } else {
        res.status(500).json({ message: error.message })
      }
    }
  }

  private async beginTransaction (
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const { database } = await schemas.beginTransactionSchema.validate(req.body)
      const transactionId = Buffer.from(uuid()).toString('base64')
      const client = await this.createClient({ database, transactionId })
      await client.beginTransaction()
      res.status(200).json({ transactionId })
    } catch (error) {
      console.error(error)
      if (error instanceof yup.ValidationError || error instanceof QueryError) {
        res.status(400).json({ message: error.message })
      } else {
        res.status(500).json({ message: error.message })
      }
    }
  }

  private async commitTransaction (
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const { transactionId } = await schemas.commitTransactionSchema.validate(req.body)
      const client = this.getClient(transactionId)
      if (client === undefined) {
        res.send(404)
      } else {
        await client.commitTransaction()
        res.status(200).json({ transactionStatus: 'Transaction Committed' })
        await this.destroyClient({ client, transactionId })
      }
    } catch (error) {
      console.error(error)
      if (error instanceof yup.ValidationError || error instanceof QueryError) {
        res.status(400).json({ message: error.message })
      } else if (error instanceof NotFoundException) {
        res.status(404).json({ message: error.message })
      } else {
        res.status(500).json({ message: error.message })
      }
    }
  }

  private async rollbackTransaction (
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const { transactionId } = await schemas.rollbackTransactionSchema.validate(req.body)
      const client = this.getClient(transactionId)
      if (client === undefined) {
        res.send(404)
      } else {
        await client.rollbackTransaction()
        res.status(200).json({ transactionStatus: 'Transaction Rolledback' })
        await this.destroyClient({ client, transactionId })
      }
    } catch (error) {
      console.error(error)
      if (error instanceof yup.ValidationError || error instanceof QueryError) {
        res.status(400).json({ message: error.message })
      } else {
        res.status(500).json({ message: error.message })
      }
    }
  }
}
