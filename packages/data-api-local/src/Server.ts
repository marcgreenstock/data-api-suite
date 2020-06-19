import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as http from 'http'
import * as uuid from 'uuid/v4'
import * as createError from 'http-errors'
import { Client } from './Client'
import {
  PostgresClient,
  PostgresClientConfig
} from './PostgresClient'

const DEFAULT_PORT = 8080
const DEFAULT_HOSTNAME = 'localhost'

export type engines = 'postgresql'

export interface ServerConfig {
  hostname?: string;
  port?: number;
}

export interface PostgresConnectionOptions extends PostgresClientConfig {
  engine: 'postgresql';
}

export type DbConfig = PostgresConnectionOptions

export interface ServerOptions {
  database: DbConfig;
  server?: ServerConfig;
  logger?: Function;
}

export class Server {
  protected app: express.Express
  protected httpServer: http.Server
  protected port: number
  protected hostname: string
  protected logger: Function
  protected logLevel: string
  protected engine: engines
  protected dbConfig: PostgresConnectionOptions
  protected pool: { [id: string]: Client }

  constructor ({
    logger = console.info,
    server,
    database
  }: ServerOptions) {
    this.logger = logger
    this.port = server.port || DEFAULT_PORT
    this.hostname = server.hostname || DEFAULT_HOSTNAME
    this.dbConfig = database
    this.pool = {}
    this.app = express()
    this.app.use(bodyParser.json())
    this.app.use(this.setRequestId.bind(this))
    this.app.post('/Execute', this.executeStatement.bind(this))
    this.app.post('/BatchExecute', this.batchExecuteStatement.bind(this))
    this.app.post('/ExecuteSql', this.executeSql.bind(this))
    this.app.post('/BeginTransaction', this.beginTransaction.bind(this))
    this.app.post('/CommitTransaction', this.commitTransaction.bind(this))
    this.app.post('/RollbackTransaction', this.rollbackTransaction.bind(this))
    this.app.use(this.handleError.bind(this))
  }

  public async start (): Promise<Server> {
    await new Promise((resolve) => {
      this.httpServer = this.app.listen(this.port, this.hostname, () => {
        this.log(`listening on http://${this.hostname}:${this.port}`)
        resolve()
      })
    })
    return this
  }

  public async stop (): Promise<void> {
    await new Promise((resolve, reject) => {
      this.httpServer.close((error) => {
        if (error) { return reject(error) }
        resolve()
      })
    })
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
    if (engine === 'postgresql') {
      client = await new PostgresClient({ ...config, database }).connect()
    } else {
      throw createError(503, `"${engine}" is not supported`)
    }
    if (transactionId !== undefined) {
      this.pool[transactionId] = client
    }
    return client
  }

  private async getClient ({
    database = this.dbConfig.database,
    transactionId
  }: {
    database?: string;
    transactionId?: string;
  }): Promise<Client> {
    if (transactionId !== undefined) {
      if (transactionId in this.pool) {
        return this.pool[transactionId]
      } else {
        throw createError(400, `Transaction ${transactionId} is not found`)
      }
    } else {
      return this.createClient({ database })
    }
  }

  private async executeSql (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> {
    const { database, sqlStatements, schema } = req.body
    try {
      if (typeof sqlStatements !== 'string' || sqlStatements.trim() === '') {
        throw createError(400, 'SQL is empty')
      }
      const client = await this.createClient({ database })
      try {
        this.log(`[executeSql] ${sqlStatements}`)
        const result = await client.executeSql({ sqlStatements, schema })
        res.status(200).send(result)
      } finally {
        await client.disconnect()
      }
    } catch (error) {
      next(error)
    }
  }

  private async executeStatement (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> {
    const {
      database,
      transactionId,
      sql,
      ...rest
    } = req.body
    try {
      if (typeof sql !== 'string' || sql.trim() === '') {
        throw createError(400, 'SQL is empty')
      }
      const client = await this.getClient({ database, transactionId })
      try {
        this.log(`[executeStatement] ${sql}`)
        const result = await client.executeStatement({ sql, ...rest })
        res.status(200).json(result)
      } finally {
        if (transactionId === undefined) {
          await client.disconnect()
        }
      }
    } catch (error) {
      next(error)
    }
  }

  private async batchExecuteStatement (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> {
    const {
      database,
      transactionId,
      sql,
      ...rest
    } = req.body
    try {
      if (typeof sql !== 'string' || sql.trim() === '') {
        throw createError(400, 'SQL is empty')
      }
      const client = await this.getClient({ database, transactionId })
      try {
        this.log(`[batchExecuteStatement] ${sql}`)
        const result = await client.batchExecuteStatement({ sql, ...rest })
        res.status(200).send(result)
      } finally {
        if (transactionId === undefined) {
          await client.disconnect()
        }
      }
    } catch (error) {
      return next(error)
    }
  }

  private async beginTransaction (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> {
    const { database, schema } = req.body
    const transactionId = Buffer.from(uuid()).toString('base64')
    try {
      const client = await this.createClient({ database, transactionId })
      try {
        this.log(`[beginTransaction] transactionId: ${transactionId}`)
        await client.beginTransaction(schema)
        res.status(200).json({ transactionId })
      } catch (error) {
        await this.pool[transactionId].disconnect()
        delete this.pool[transactionId]
        throw error
      }
    } catch (error) {
      next(error)
    }
  }

  private async commitTransaction (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> {
    const { transactionId } = req.body
    try {
      if (typeof transactionId !== 'string' || transactionId.trim() === '') {
        throw createError(400, 'Transaction ID is empty')
      }
      const client = await this.getClient({ transactionId })
      try {
        this.log(`[commitTransaction] transactionId: ${transactionId}`)
        await client.commitTransaction()
        res.status(200).json({ transactionStatus: 'Transaction Committed' })
      } finally {
        await this.pool[transactionId].disconnect()
        delete this.pool[transactionId]
      }
    } catch (error) {
      next(error)
    }
  }

  private async rollbackTransaction (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> {
    const { transactionId } = req.body
    try {
      if (typeof transactionId !== 'string' || transactionId.trim() === '') {
        throw createError(400, 'Transaction ID is empty')
      }
      const client = await this.getClient({ transactionId })
      try {
        this.log(`[rollbackTransaction] transactionId: ${transactionId}`)
        await client.rollbackTransaction()
        res.status(200).json({ transactionStatus: 'Transaction Rolledback' })
      } finally {
        await this.pool[transactionId].disconnect()
        delete this.pool[transactionId]
      }
    } catch (error) {
      next(error)
    }
  }

  private setRequestId (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void {
    const id = uuid()
    this.log(`[request] ${req.method} ${req.path} - requestId: ${id}`)
    res.setHeader('x-amzn-RequestId', id)
    next()
  }

  private handleError (
    error: Error,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void {
    /* istanbul ignore next */
    if (res.headersSent) { return next(error) }
    const errorTypes = {
      400: 'BadRequestException:http://internal.amazon.com/coral/com.amazon.rdsdataservice/',
      403: 'ForbiddenException:http://internal.amazon.com/coral/com.amazon.rdsdataservice/',
      404: 'NotFoundException:http://internal.amazon.com/coral/com.amazon.rdsdataservice/',
      500: 'InternalServerErrorException:http://internal.amazon.com/coral/com.amazon.rdsdataservice/',
      503: 'ServiceUnavailableError:http://internal.amazon.com/coral/com.amazon.rdsdataservice/'
    }
    let statusCode = 500
    if (error instanceof createError.HttpError) {
      statusCode = error.statusCode
    }
    res.setHeader('x-amzn-ErrorType', errorTypes[statusCode])
    res.status(statusCode).json({ message: error.message })
  }

  private log (message: string): void {
    if (typeof this.logger === 'function') {
      this.logger(message)
    }
  }
}
