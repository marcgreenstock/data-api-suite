import {
  ClientConfig as UpstreamPostgresClientConfig,
  Client as UpstreamPostgresClient,
  QueryResult
} from 'pg'
import {
  ConnectionConfig as MySQLConnectionConfig,
  Connection as MySQLConnection
} from 'mysql'
import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { transformQuery } from './utils/transformQuery'
import { transformResult } from './utils/transformResult'

export type PostgresClientConfig = UpstreamPostgresClientConfig

export type MysqlClientConfig = MySQLConnectionConfig

export interface ExecuteStatementRequest {
  sql: RDSDataService.Types.SqlStatement
  parameters?: RDSDataService.Types.SqlParametersList
}

export abstract class Client {
  abstract async connect (): Promise<Client>

  abstract async disconnect (): Promise<void>

  abstract async beginTransaction (): Promise<void>

  abstract async commitTransaction (): Promise<any>

  abstract async rollbackTransaction (): Promise<void>

  abstract async query (params: ExecuteStatementRequest): Promise<RDSDataService.Types.ExecuteStatementResponse>
}

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

  async disconnect () {

  }

  async beginTransaction () {

  }

  async commitTransaction () {

  }

  async rollbackTransaction () {

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

export class PostgresClient implements Client {
  protected client: UpstreamPostgresClient
  protected config: string | PostgresClientConfig

  constructor (config: string | PostgresClientConfig) {
    this.config = config
  }

  async connect (): Promise<PostgresClient> {
    const { Client } = await import('pg')
    console.log('Connecting')
    this.client = new Client(this.config)
    await this.client.connect()
    return this
  }

  async disconnect (): Promise<void> {
    console.log('Disconnecting')
    await this.client.end()
  }

  async beginTransaction (): Promise<any> {
    console.log('BEGIN')
    this.client.query({ text: 'BEGIN;' })
  }

  async commitTransaction () {
    console.log('COMMIT')
    return this.client.query({ text: 'COMMIT;' })
  }

  async rollbackTransaction () {
    console.log('ROLLBACK')
    this.client.query({ text: 'ROLLBACK;' })
  }

  async query ({
    sql,
    parameters
  }: ExecuteStatementRequest): Promise<RDSDataService.Types.ExecuteStatementResponse> {
    console.log(`Executing ${sql}`)
    try {
      const { query, values } = transformQuery(sql, parameters)
      console.log(query)
      console.log(JSON.stringify(values, undefined, 2))
      const [tables, columns, result] = await Promise.all([
        this.tables(),
        this.columns(),
        this.client.query({ text: query, values })
      ])
      return transformResult(result)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async columns () {
    const result = await this.client.query({
      text: 'SELECT * FROM information_schema.columns where table_schema = $1;',
      values: ['public']
    })
    return result.rows
  }

  async tables () {
    const result = await this.client.query({
      text: `
        select nsp.nspname as object_schema,
            cls.relname as object_name,
            rol.rolname as owner,
            case cls.relkind
              when 'r' then 'TABLE'
              when 'm' then 'MATERIALIZED_VIEW'
              when 'i' then 'INDEX'
              when 'S' then 'SEQUENCE'
              when 'v' then 'VIEW'
              when 'c' then 'TYPE'
              else cls.relkind::text
            end as object_type
      from pg_class cls
      join pg_roles rol on rol.oid = cls.relowner
      join pg_namespace nsp on nsp.oid = cls.relnamespace
      where nsp.nspname not in ('information_schema', 'pg_catalog')
      and nsp.nspname not like 'pg_toast%'
      and rol.rolname = current_user  --- remove this if you want to see all objects
      order by nsp.nspname, cls.relname;`
    })
    return result.rows
  }
}
