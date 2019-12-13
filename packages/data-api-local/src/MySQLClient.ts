import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'
import {
  ConnectionConfig as MySQLConnectionConfig,
  Connection as MySQLConnection
} from 'mysql'
import {
  Client,
  ExecuteStatementRequest
} from './Client'

export type MysqlClientConfig = MySQLConnectionConfig

export class MySQLClient implements Client {
  protected client: MySQLConnection
  protected config: string | MysqlClientConfig

  constructor (config: string | MysqlClientConfig) {
    this.config = config
  }

  async connect (): Promise<MySQLClient> {
    const { createConnection } = await import('mysql')
    this.client = createConnection(this.config)
    await new Promise((resolve, reject) => {
      this.client.connect((error) => {
        if (error) { reject(error) }
        resolve()
      })
    })
    return this
  }

  async disconnect (): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.end((error) => {
        if (error !== undefined) { return reject(error) }
        resolve()
      })
    })
  }

  async beginTransaction (): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.query({ sql: 'BEGIN;' }, (error) => {
        if (error !== undefined) { return reject(error) }
        resolve()
      })
    })
  }

  async commitTransaction (): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.query({ sql: 'COMMIT;' }, (error) => {
        if (error !== undefined) { return reject(error) }
        resolve()
      })
    })
  }

  async rollbackTransaction (): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.query({ sql: 'ROLLBACK;' }, (error) => {
        if (error !== undefined) { return reject(error) }
        resolve()
      })
    })
  }

  async query ({
    sql,
    parameters
  }: ExecuteStatementRequest): Promise<RDSDataService.Types.ExecuteStatementResponse> {
    return new Promise((resolve, reject) => {
      this.client.query({ sql, values: parameters }, (error, records) => {
        if (error) {
          return reject(error)
        } else {
          resolve({
            columnMetadata: undefined,
            generatedFields: undefined,
            numberOfRecordsUpdated: undefined,
            records
          })
        }
      })
    })
  }
}
