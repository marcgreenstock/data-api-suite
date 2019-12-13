import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'
import {
  ClientConfig as UpstreamPostgresClientConfig,
  Client as UpstreamPostgresClient
} from 'pg'
import {
  Client,
  ExecuteStatementRequest
} from './Client'
import { transformQuery } from './utils/transformQuery'
import { transformResult } from './utils/transformResult'

export type PostgresClientConfig = UpstreamPostgresClientConfig

export class PostgresClient implements Client {
  protected client: UpstreamPostgresClient
  protected config: string | PostgresClientConfig

  constructor (config: string | PostgresClientConfig) {
    this.config = config
  }

  async connect (): Promise<PostgresClient> {
    const { Client } = await import('pg')
    this.client = new Client(this.config)
    await this.client.connect()
    return this
  }

  async disconnect (): Promise<void> {
    await this.client.end()
  }

  async beginTransaction (): Promise<void> {
    await this.client.query({ text: 'BEGIN;' })
  }

  async commitTransaction (): Promise<void> {
    await this.client.query({ text: 'COMMIT;' })
  }

  async rollbackTransaction (): Promise<void> {
    await this.client.query({ text: 'ROLLBACK;' })
  }

  async query ({
    sql,
    parameters
  }: ExecuteStatementRequest): Promise<RDSDataService.Types.ExecuteStatementResponse> {
    try {
      const { query, values } = transformQuery(sql, parameters)
      const result = await this.client.query({ text: query, values })
      // const [,,result] = await Promise.all([
      //   this.tables(),
      //   this.columns(),
      //   this.client.query({ text: query, values })
      // ])
      return transformResult(result)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  // async columns () {
  //   const result = await this.client.query({
  //     text: 'SELECT * FROM information_schema.columns where table_schema = $1;',
  //     values: ['public']
  //   })
  //   return result.rows
  // }

  // async tables () {
  //   const result = await this.client.query({
  //     text: `
  //       select nsp.nspname as object_schema,
  //           cls.relname as object_name,
  //           rol.rolname as owner,
  //           case cls.relkind
  //             when 'r' then 'TABLE'
  //             when 'm' then 'MATERIALIZED_VIEW'
  //             when 'i' then 'INDEX'
  //             when 'S' then 'SEQUENCE'
  //             when 'v' then 'VIEW'
  //             when 'c' then 'TYPE'
  //             else cls.relkind::text
  //           end as object_type
  //     from pg_class cls
  //     join pg_roles rol on rol.oid = cls.relowner
  //     join pg_namespace nsp on nsp.oid = cls.relnamespace
  //     where nsp.nspname not in ('information_schema', 'pg_catalog')
  //     and nsp.nspname not like 'pg_toast%'
  //     and rol.rolname = current_user  --- remove this if you want to see all objects
  //     order by nsp.nspname, cls.relname;`
  //   })
  //   return result.rows
  // }
}
