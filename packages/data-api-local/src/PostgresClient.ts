import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'
import * as createError from 'http-errors'
import {
  ClientConfig as UpstreamPostgresClientConfig,
  Client as UpstreamPostgresClient,
  FieldDef,
  QueryArrayResult,
} from 'pg'
import {
  Client,
  ExecuteSqlRequest,
  ExecuteStatementRequest,
  BatchExecuteStatementRequest
} from './Client'
import { transformQuery } from './utils/transformQuery'
import { transformResult } from './utils/transformResult'

const getColumnTypeData = (field: FieldDef): RDSDataService.Types.ColumnMetadata => {
  if (field.dataTypeSize == -1 && field.dataTypeModifier == -1) {
    return { precision: 2147483647, scale: 0 }
  }
  switch (field.dataTypeID) {
    case 20: // int8
    case 1016: // _int8
      return {
        precision: 19,
        scale: 0,
        isSigned: true
      }
    case 21: // int2
    case 1005: // _int2
      return {
        precision: 5,
        scale: 0,
        isSigned: true
      }
    case 23: // int4
    case 1007: // _int4
    case 26: // oid
    case 1028: // _oid
      return {
        precision: 10,
        scale: 0,
        isSigned: true
      }
    case 700: // float4
    case 1021: // _float4
      return {
        precision: 8,
        scale: 8,
        isSigned: true
      }
    case 701: // float8
    case 1022: // _float8
      return {
        precision: 17,
        scale: 17,
        isSigned: true
      }
    case 1700: // numeric
    case 1231: // _numeric
      return {
        precision: ((field.dataTypeModifier - 4) >> 16) & 65535,
        scale: (field.dataTypeModifier - 4) & 65535,
        isSigned: true
      }
    default:
      return {
        precision: 2147483647,
        scale: 0,
        isCaseSensitive: true
      }
  }
}

export type PostgresClientConfig = UpstreamPostgresClientConfig

export class PostgresClient implements Client {
  protected client: UpstreamPostgresClient
  protected config: string | PostgresClientConfig

  constructor (config: string | PostgresClientConfig) {
    this.config = config
  }

  public async connect (): Promise<PostgresClient> {
    this.client = new UpstreamPostgresClient(this.config)

    await this.client.connect()
    return this
  }

  public async disconnect (): Promise<void> {
    return this.client.end()
  }

  public async beginTransaction (schema?: string): Promise<void> {
    await this.query({ query: 'BEGIN', schema })
  }

  public async commitTransaction (): Promise<void> {
    await this.query({ query: 'COMMIT' })
  }

  public async rollbackTransaction (): Promise<void> {
    await this.query({ query: 'ROLLBACK' })
  }

  public async executeSql ({
    sqlStatements,
    schema
  }: ExecuteSqlRequest): Promise<RDSDataService.Types.ExecuteSqlResponse> {
    await this.query({ query: sqlStatements, schema })
    return {
      sqlStatementResults: []
    }
  }

  public async executeStatement ({
    sql,
    parameters,
    schema,
    includeResultMetadata = false
  }: ExecuteStatementRequest): Promise<RDSDataService.Types.ExecuteStatementResponse> {
    const { query, values } = transformQuery(sql, parameters)
    const result = await this.query({ query, values, schema })
    return {
      columnMetadata: includeResultMetadata ? await this.buildColumnMetadata(result.fields) : undefined,
      records: transformResult(result),
      numberOfRecordsUpdated: result.command === 'UPDATE' ? result.rowCount : 0
    }
  }

  public async batchExecuteStatement ({
    sql,
    schema,
    parameterSets = []
  }: BatchExecuteStatementRequest): Promise<RDSDataService.Types.BatchExecuteStatementResponse> {
    await Promise.all(
      parameterSets.map((parameters) => {
        const { query, values } = transformQuery(sql, parameters)
        return this.query({ query, values, schema })
      })
    )
    return {
      updateResults: []
    }
  }

  private async query ({ query, values, schema = 'public' }: { query: string; values?: unknown[], schema?: string }): Promise<QueryArrayResult> {
    try {
      await this.client.query(`SET search_path TO ${schema};`);
      return await this.client.query({ text: query, values, rowMode: 'array' })
    } catch (error) {
      throw createError(400, `${error.severity}: ${error.message}\n  Position: ${error.position}`)
    }
  }

  private async buildColumnMetadata (fields: FieldDef[]): Promise<RDSDataService.Types.Metadata> {
    const [typeMetadata, tableMetadata] = await Promise.all([
      this.fetchTypeMetadata(fields),
      this.fetchTableMetadata(fields)
    ])
    return fields.map((field, index) => ({
      arrayBaseColumnType: 0,
      isAutoIncrement: false,
      isCaseSensitive: false,
      isCurrency: false,
      isSigned: false,
      schemaName: '',
      tableName: '',
      nullable: 0,
      name: field.name,
      label: field.name,
      ...typeMetadata[index],
      ...tableMetadata[index],
      ...getColumnTypeData(field)
    }))
  }

  private async fetchTypeMetadata (fields: FieldDef[]): Promise<RDSDataService.Types.Metadata> {
    const oids = [...new Set(fields.map((field) => field.dataTypeID))]
    const query = {
      text: `SELECT oid AS "type", typname AS "typeName" FROM pg_type WHERE oid = ANY($1::oid[])`,
      values: [oids]
    }
    const result = await this.client.query(query)
    return fields.map((field) => {
      const { type, typeName } = result.rows.find(({ type }) => type === field.dataTypeID)
      return { type, typeName }
    })
  }

  private async fetchTableMetadata (fields: FieldDef[]): Promise<RDSDataService.Types.Metadata> {
    const oids = [...new Set(fields.map((field) => field.tableID))]
    const query = {
      text: `
        SELECT
          c.oid AS "tableID",
          a.attnum AS "columnID",
          c.relname AS "tableName",
          CASE a.attnotnull
            WHEN true THEN 0
            WHEN false then 1
          END AS "nullable",
          CASE
            WHEN pg_get_serial_sequence(n.nspname||'.'||c.relname, a.attname) IS NULL
            THEN false
            ELSE true
          END AS "isAutoIncrement"
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          JOIN pg_attribute a ON attrelid = c.oid
          WHERE c.oid = ANY($1::oid[])
          ORDER BY a.attnum ASC
      `,
      values: [oids]
    }
    const result = await this.client.query(query)
    return fields.map((field) => {
      const row = result.rows.find(({ tableID, columnID }) => tableID === field.tableID && columnID === field.columnID)
      if (row) {
        const {
          tableName,
          nullable,
          isAutoIncrement
        } = result.rows.find(({ tableID, columnID }) => tableID === field.tableID && columnID === field.columnID)
        return {
          nullable,
          tableName,
          isAutoIncrement
        }
      } else {
        return {}
      }
    })
  }
}
