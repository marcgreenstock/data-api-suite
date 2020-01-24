import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'
import * as Errors from './Errors'
import * as Transaction from './Transaction'
import {
  transformQueryParams,
  CustomValue,
  SqlParameter,
  QueryParam,
  QueryParams,
} from './transformQueryParams'
import {
  transformQueryResponse,
  Metadata,
  TransformedQueryResult,
  TransformQueryResponseOptions,
  UnknownRow,
  ValueTransformer,
} from './transformQueryResponse'
import {
  JSONValue,
  BlobValue,
} from  './customValues'

declare namespace AuroraDataAPI {
  export {
    Errors,
    Transaction,
    RDSDataService,
  }

  export {
    CustomValue,
    QueryParam,
    QueryParams,
    SqlParameter,
  }

  export {
    Metadata,
    ValueTransformer,
    TransformQueryResponseOptions,
    UnknownRow,
  }

  export {
    JSONValue,
    BlobValue,
  }

  export interface RequestConfig {
    continueAfterTimeout?: RDSDataService.Boolean;
    database?: RDSDataService.DbName;
    resourceArn: RDSDataService.Arn;
    resultSetOptions?: RDSDataService.ResultSetOptions;
    schema?: RDSDataService.DbName;
    secretArn: RDSDataService.Arn;
  }

  export type ClientConfig = Omit<RDSDataService.ClientConfiguration, 'apiVersion'>

  export type AuroraDataAPIConfig = RequestConfig & TransformQueryResponseOptions & ClientConfig

  export interface BeginTransactionOptions {
    database?: RDSDataService.DbName;
    resourceArn?: RDSDataService.Arn;
    schema?: RDSDataService.DbName;
    secretArn?: RDSDataService.Arn;
  }

  export type BeginTransactionResult = Transaction

  export interface CommitTransactionOptions {
    resourceArn?: RDSDataService.Arn;
    secretArn?: RDSDataService.Arn;
  }

  export type CommitTransactionResult = RDSDataService.CommitTransactionResponse

  export type RollbackTransactionOptions = CommitTransactionOptions

  export type RollbackTransactionResult = RDSDataService.RollbackTransactionResponse

  export interface QueryOptions extends TransformQueryResponseOptions {
    continueAfterTimeout?: RDSDataService.Boolean;
    database?: RDSDataService.DbName;
    includeResultMetadata?: RDSDataService.Boolean;
    resourceArn?: RDSDataService.Arn;
    resultSetOptions?: RDSDataService.ResultSetOptions;
    schema?: RDSDataService.DbName;
    secretArn?: RDSDataService.Arn;
    transactionId?: RDSDataService.Id;
  }

  export type QueryResult<T = UnknownRow> = TransformedQueryResult<T> & RDSDataService.ExecuteStatementResponse

  export interface BatchQueryOptions {
    database?: RDSDataService.DbName;
    resourceArn?: RDSDataService.Arn;
    schema?: RDSDataService.DbName;
    secretArn?: RDSDataService.Arn;
    transactionId?: RDSDataService.Id;
  }

  export type BatchQueryResult = RDSDataService.BatchExecuteStatementResponse

  export interface ExecuteStatementOptions extends QueryOptions {
    sql: RDSDataService.SqlStatement;
    parameters?: RDSDataService.SqlParametersList;
  }

  export type ExecuteStatementResult = RDSDataService.ExecuteStatementResponse

  export interface BatchExecuteStatementOptions extends BatchQueryOptions {
    sql: RDSDataService.SqlStatement;
    parameterSets?: RDSDataService.SqlParameterSets;
  }

  export type BatchExecuteStatementResult = RDSDataService.BatchExecuteStatementResponse
}

class AuroraDataAPI {
  public readonly transformOptions: TransformQueryResponseOptions
  public readonly client: RDSDataService
  public readonly requestConfig: AuroraDataAPI.RequestConfig

  constructor (config: AuroraDataAPI.AuroraDataAPIConfig) {
    const {
      continueAfterTimeout,
      database,
      resourceArn,
      resultSetOptions,
      schema,
      secretArn,
      valueTransformer,
      ...clientConfig
    } = config
    this.transformOptions = {
      valueTransformer,
    }
    this.requestConfig = {
      continueAfterTimeout,
      database,
      resourceArn,
      resultSetOptions,
      schema,
      secretArn,
    }
    this.client = new RDSDataService({
      ...clientConfig,
      apiVersion: '2018-08-01'
    })
  }

  public async beginTransaction (
    options?: AuroraDataAPI.BeginTransactionOptions,
  ): Promise<AuroraDataAPI.BeginTransactionResult> {
    const {
      database,
      resourceArn,
      schema,
      secretArn,
    } = {
      ...this.requestConfig,
      ...options,
    }
    const { transactionId } = await this.client.beginTransaction({
      database,
      resourceArn,
      schema,
      secretArn,
    }).promise()
    if (transactionId === undefined) {
      throw new Error('transactionId missing from response')
    }
    return new Transaction(this, transactionId, {
      database,
      resourceArn,
      schema,
      secretArn,
    })
  }

  public async commitTransaction (
    transactionId: string,
    options?: AuroraDataAPI.CommitTransactionOptions,
  ): Promise<AuroraDataAPI.CommitTransactionResult> {
    const {
      resourceArn,
      secretArn,
    } = {
      ...this.requestConfig,
      ...options,
    }
    return this.client.commitTransaction({
      resourceArn,
      secretArn,
      transactionId,
    }).promise()
  }

  public async rollbackTransaction (
    transactionId: string,
    options?: AuroraDataAPI.RollbackTransactionOptions,
  ): Promise<AuroraDataAPI.CommitTransactionResult> {
    const {
      resourceArn,
      secretArn,
    } = {
      ...this.requestConfig,
      ...options,
    }
    return this.client.rollbackTransaction({
      resourceArn,
      secretArn,
      transactionId,
    }).promise()
  }

  public async query<T = UnknownRow> (
    sql: string,
    params?: AuroraDataAPI.QueryParams,
    options: AuroraDataAPI.QueryOptions = {},
  ): Promise<AuroraDataAPI.QueryResult<T>> {
    const methodOptions = {
      includeResultMetadata: true,
      parseTimestamps: true,
      ...options,
    }
    const {
      valueTransformer,
      ...executeStatementOptions
    } = methodOptions
    const transformOptions = {
      ...this.transformOptions,
      valueTransformer,
    }
    const parameters = params !== undefined ? transformQueryParams(params) : undefined
    const result = await this.executeStatement({
      ...executeStatementOptions,
      sql,
      parameters,
    })
    const transformedResult = executeStatementOptions.includeResultMetadata
      ? transformQueryResponse<T>(result, transformOptions)
      : undefined
    return {
      ...result,
      ...transformedResult,
    }
  }

  public async executeStatement(
    options: AuroraDataAPI.ExecuteStatementOptions,
  ): Promise<AuroraDataAPI.ExecuteStatementResult> {
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
      transactionId,
    } = {
      ...this.requestConfig,
      ...options,
    }
    return this.client.executeStatement({
      parameters,
      continueAfterTimeout,
      database,
      includeResultMetadata,
      resourceArn,
      resultSetOptions,
      schema,
      secretArn,
      sql,
      transactionId,
    }).promise()
  }

  public async batchQuery (
    sql: string,
    params?: AuroraDataAPI.QueryParams[],
    options?: AuroraDataAPI.BatchQueryOptions,
  ): Promise<AuroraDataAPI.BatchQueryResult> {
    const parameterSets = params?.map(transformQueryParams)
    return this.batchExecuteStatement({
      ...options,
      sql,
      parameterSets,
    })
  }

  public async batchExecuteStatement(
    options: AuroraDataAPI.BatchExecuteStatementOptions,
  ): Promise<AuroraDataAPI.BatchExecuteStatementResult> {
    const {
      parameterSets,
      database,
      resourceArn,
      schema,
      secretArn,
      sql,
      transactionId,
    } = {
      ...this.requestConfig,
      ...options,
    }
    return this.client.batchExecuteStatement({
      parameterSets,
      database,
      resourceArn,
      schema,
      secretArn,
      sql,
      transactionId,
    }).promise()
  }
}

Object.assign(AuroraDataAPI, {
  Errors,
  Transaction,
  JSONValue,
  BlobValue
})

export = AuroraDataAPI
