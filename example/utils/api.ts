import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'

type Value = null | string | number | boolean
type FieldValue = Value | RDSDataService._Blob
type ArrayValue = Array<Value | ArrayValue | undefined>

export interface UnknownRow {
  [key: string]: FieldValue | ArrayValue | RDSDataService._Blob | undefined;
}

const transformArrayValue = (value: RDSDataService.ArrayValue): ArrayValue | undefined => {
  if (value.stringValues !== undefined) { return value.stringValues }
  if (value.longValues !== undefined) { return value.longValues }
  if (value.doubleValues !== undefined) { return value.doubleValues }
  if (value.booleanValues !== undefined) { return value.booleanValues }
  if (value.arrayValues !== undefined) { 
    return value.arrayValues.map((arrayValue) => transformArrayValue(arrayValue))
  }
}

const transformResultValue = (field: RDSDataService.Field): FieldValue | ArrayValue | undefined => {
  if (field.isNull) { return null }
  if (field.stringValue !== undefined) { return field.stringValue }
  if (field.longValue !== undefined) { return field.longValue }
  if (field.doubleValue !== undefined) { return field.doubleValue }
  if (field.booleanValue !== undefined) { return field.booleanValue }
  if (field.blobValue !== undefined) { return field.blobValue }
  if (field.arrayValue !== undefined) { return transformArrayValue(field.arrayValue) }
}

export const transformResult = <T = UnknownRow>(result: RDSDataService.ExecuteStatementResponse): T[] => {
  const { records, columnMetadata } = result
  if (records === undefined) {
    throw new Error('records is undefined')
  }
  if (columnMetadata === undefined) {
    throw new Error('columnMetadata is undefined')
  }
  const rows = records.map((fieldList) => {
    return fieldList.reduce((row, field, index) => {
      const column = columnMetadata[index]
      const value = transformResultValue(field)
      if (column.name === undefined) {
        throw new Error('name is undefined')
      }
      return {
        ...row,
        [column.name]: value
      }
    }, {})
  }) as T[]
  return rows
}

type ParamValue = string | number | boolean

// type StringArray = Array<string> | Array<StringArray>
// type NumberArray = Array<number> | Array<NumberArray>
// type BooleanArray = Array<boolean> | Array<BooleanArray>
// type ParamValueArray = StringArray | NumberArray | BooleanArray | Array<ParamValueArray>
type ParamArrayValue = (string | number | boolean | ParamArrayValue)[]

interface Params {
  [name: string]: ParamValue | ParamArrayValue | Omit<RDSDataService.SqlParameter, 'name'>;
}

const transformParamArrayValue = (paramValueArray: ParamArrayValue): RDSDataService.ArrayValue => {
  return paramValueArray.reduce<RDSDataService.ArrayValue>((result, paramValue) => {
    if (paramValue instanceof Array) {
      const arrayValues = result.arrayValues || []
      return {
        ...result,
        arrayValues: [...arrayValues, transformParamArrayValue(paramValue)]
      }
    }
    if (typeof paramValue === 'boolean') {
      const booleanValues = result.booleanValues || []
      return {
        ...result,
        booleanValues: [...booleanValues, paramValue]
      }
    }
    if (typeof paramValue === 'number') {
      if (Number.isInteger(paramValue)) {
        const longValues = result.longValues || []
        return {
          ...result,
          longValues: [...longValues, paramValue]
        }
      }
      const doubleValues = result.doubleValues || []
      return {
        ...result,
        doubleValues: [...doubleValues, paramValue]
      }
    }
    if (typeof paramValue === 'string') {
      const stringValues = result.stringValues || []
      return {
        ...result,
        stringValues: [...stringValues, paramValue]
      }
    }
    return result
  }, {})
} 

const transformParamValue = (value: ParamValue | ParamArrayValue): RDSDataService.Field => {
  if (Array.isArray(value)) {
    return { arrayValue: transformParamArrayValue(value) }
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value }
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { longValue: value }
    } else {
      return { doubleValue: value }
    }
  }
  return { stringValue: value }
}

const transformParams = (params: Params): RDSDataService.SqlParametersList => {
  return Object.entries(params).map(([name, paramValue]) => {
    if (typeof paramValue === 'object' && !Array.isArray(paramValue)) {
      return { name, ...paramValue }
    }
    const value = transformParamValue(paramValue)
    return { name, value }
  })
}

type RequestConfig = Pick<RDSDataService.ExecuteStatementRequest, 
  'continueAfterTimeout' | 'database' | 'resourceArn' | 'resultSetOptions' | 'schema' | 'secretArn'
>
export type DataAPIConfig = RDSDataService.ClientConfiguration & RequestConfig

export interface BeginTranactionOptions {
  database?: string;
  resourceArn?: string;
  schema?: string;
  secretArn?: string;
}

export interface QueryOptions {
  continueAfterTimeout?: boolean;
  database?: string;
  includeResultMetadata: boolean;
  resourceArn?: string;
  resultSetOptions?: RDSDataService.ResultSetOptions;
  schema?: string;
  secretArn?: string;
  transactionId?: string;
}
export interface QueryResult<T = UnknownRow> extends RDSDataService.ExecuteStatementResponse {
  rows?: T[];
}

export interface BatchQueryOptions {
  database?: string;
  resourceArn?: string;
  schema?: string;
  secretArn?: string;
  transactionId?: string;
}

export class DataAPITransaction {
  public readonly dataApi: DataAPI
  public readonly transactionId: string

  constructor (dataApi: DataAPI, transactionId: string) {
    this.dataApi = dataApi
    this.transactionId = transactionId
  }

  public async commit () {

  }

  public async query<T = UnknownRow> (
    sql: string,
    params?: Params,
    options: QueryOptions = {
      includeResultMetadata: true
    }
  ): Promise<QueryResult<T>> {
    return this.dataApi.query(sql, params, options)
  }
}

export class DataAPI {
  public readonly client: RDSDataService
  public readonly requestConfig: RequestConfig

  constructor (config: DataAPIConfig) {
    const {
      continueAfterTimeout,
      database,
      resourceArn,
      resultSetOptions,
      schema,
      secretArn,
      ...clientOptions
    } = config
    this.requestConfig = {
      continueAfterTimeout,
      database,
      resourceArn,
      resultSetOptions,
      schema,
      secretArn
    }
    this.client = new RDSDataService({
      apiVersion: '2018-08-01',
      ...clientOptions
    })
  }

  public async beginTransaction (
    options?: BeginTranactionOptions
  ): Promise<DataAPITransaction> {
    const {
      database,
      resourceArn,
      schema,
      secretArn
    } = {
      ...this.requestConfig,
      ...options
    }
    const { transactionId } = await this.client.beginTransaction({
      database,
      resourceArn,
      schema,
      secretArn
    }).promise()
    if (transactionId === undefined) {
      throw new Error('transactionId missing from response')
    }
    return new DataAPITransaction(this, transactionId)
  }

  public async query<T = UnknownRow> (
    sql: string,
    params?: Params,
    options: QueryOptions = {
      includeResultMetadata: true
    }
  ): Promise<QueryResult<T>> {
    const parameters = params !== undefined ? transformParams(params) : undefined
    const result = await this.executeStatement({
      ...options,
      sql,
      parameters
    })
    return {
      ...result,
      rows: options.includeResultMetadata ? transformResult<T>(result) : undefined
    }
  }

  public async executeStatement(options: {
    sql: string;
    includeResultMetadata?: boolean;
    parameters?: RDSDataService.SqlParametersList;
  } & QueryOptions): Promise<RDSDataService.ExecuteStatementResponse> {
    const {
      parameters,
      continueAfterTimeout,
      database,
      includeResultMetadata,
      resourceArn,
      resultSetOptions,
      schema,
      secretArn,
      sql,
      transactionId
    } = {
      ...this.requestConfig,
      ...options
    }
    return await this.client.executeStatement({
      parameters,
      continueAfterTimeout,
      database,
      includeResultMetadata,
      resourceArn,
      resultSetOptions,
      schema,
      secretArn,
      sql,
      transactionId
    }).promise()
  }

  public async batchQuery (
    sql: string,
    params?: Params[],
    options?: BatchQueryOptions
  ): Promise<RDSDataService.BatchExecuteStatementResponse> {
    const parameterSets = params?.map(transformParams)
    return this.batchExecuteStatement({
      ...options,
      sql,
      parameterSets
    })
  }

  public async batchExecuteStatement(options: {
    sql: string;
    parameterSets?: RDSDataService.SqlParameterSets;
  } & BatchQueryOptions): Promise<RDSDataService.BatchExecuteStatementResponse> {
    const {
      parameterSets,
      database,
      resourceArn,
      schema,
      secretArn,
      sql,
      transactionId
    } = {
      ...this.requestConfig,
      ...options
    }
    return await this.client.batchExecuteStatement({
      parameterSets,
      database,
      resourceArn,
      schema,
      secretArn,
      sql,
      transactionId
    }).promise()
  }
}