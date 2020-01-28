import * as AuroraDataAPI from './AuroraDataAPI'

declare namespace Transaction {
  export type QueryOptions = Pick<
  AuroraDataAPI.QueryOptions,
    'continueAfterTimeout' | 'includeResultMetadata' | 'resultSetOptions' | 'valueTransformer'
  >
  export type ExecuteStatementOptions = Pick<
  AuroraDataAPI.ExecuteStatementOptions,
    'continueAfterTimeout' | 'includeResultMetadata' | 'parameters' | 'resultSetOptions' | 'sql'
  >
  export type BatchExecuteStatementOptions = Pick<
  AuroraDataAPI.BatchExecuteStatementOptions,
    'parameterSets' | 'sql'
  >
}

class Transaction {
  public isComplete: boolean
  public readonly dataApi: AuroraDataAPI
  public readonly transactionId: string
  public readonly requestConfig: AuroraDataAPI.RequestConfig

  constructor (dataApi: AuroraDataAPI, transactionId: string, requestConfig: AuroraDataAPI.RequestConfig) {
    this.isComplete = false
    this.dataApi = dataApi
    this.transactionId = transactionId
    this.requestConfig = requestConfig
  }

  /**
   * Performs a commit of the transaction.
   */
  public async commit (): Promise<AuroraDataAPI.CommitTransactionResult> {
    const {
      secretArn,
      resourceArn,
    } = this.requestConfig
    const result = await this.dataApi.commitTransaction(this.transactionId, {
      secretArn,
      resourceArn,
    })
    this.isComplete = true
    return result
  }

  /**
   * Performs a rollback of the transaction and cancels its changes.
   */
  public async rollback (): Promise<AuroraDataAPI.RollbackTransactionResult> {
    const {
      secretArn,
      resourceArn,
    } = this.requestConfig
    const result =  await this.dataApi.rollbackTransaction(this.transactionId, {
      secretArn,
      resourceArn,
    })
    this.isComplete = true
    return result
  }

  /**
   * Runs a SQL statement against a database.
   *
   * The response size limit is 1 MB or 1,000 records.
   * If the call returns more than 1 MB of response data or over 1,000 records, the call is terminated.
   * @param sql - The SQL query string to perform.
   * @param [params] - `name`, `value` object with the `name` representing the `:name` placeholder in the `sql` argument and the value either a `string`, `boolean` or `number` type, or as a `RDSDataService.Field` (without `name`).
   * @param [options] - Options
   */
  public async query<T = AuroraDataAPI.UnknownRow> (
    sql: string,
    params?: AuroraDataAPI.QueryParams,
    options?: Transaction.QueryOptions,
  ): Promise<AuroraDataAPI.QueryResult<T>> {
    const transactionId = this.transactionId
    const {
      database,
      resourceArn,
      schema,
      secretArn,
    } = this.requestConfig
    const {
      continueAfterTimeout,
      includeResultMetadata,
      resultSetOptions,
      valueTransformer,
    } = {
      ...this.requestConfig,
      ...options
    }
    return this.dataApi.query(sql, params, {
      continueAfterTimeout,
      database,
      includeResultMetadata,
      resourceArn,
      resultSetOptions,
      schema,
      secretArn,
      transactionId,
      valueTransformer,
    })
  }

  public async batchQuery  (
    sql: string,
    params?: AuroraDataAPI.QueryParams[],
  ): Promise<AuroraDataAPI.BatchQueryResult> {
    const transactionId = this.transactionId
    const {
      database,
      resourceArn,
      schema,
      secretArn,
    } = this.requestConfig
    return this.dataApi.batchQuery(sql, params, {
      database,
      resourceArn,
      schema,
      secretArn,
      transactionId,
    })
  }

  public async executeStatement (
    options: Transaction.ExecuteStatementOptions,
  ): Promise<AuroraDataAPI.ExecuteStatementResult> {
    const transactionId = this.transactionId
    const {
      database,
      resourceArn,
      schema,
      secretArn,
    } = this.requestConfig
    const {
      continueAfterTimeout,
      includeResultMetadata,
      parameters,
      resultSetOptions,
      sql,
    } = {
      ...this.requestConfig,
      ...options
    }
    return this.dataApi.executeStatement({
      continueAfterTimeout,
      database,
      includeResultMetadata,
      parameters,
      resourceArn,
      resultSetOptions,
      schema,
      secretArn,
      sql,
      transactionId,
    })
  }

  public async batchExecuteStatement (
    options: Transaction.BatchExecuteStatementOptions,
  ): Promise<AuroraDataAPI.BatchExecuteStatementResult> {
    const transactionId = this.transactionId
    const {
      database,
      resourceArn,
      schema,
      secretArn,
    } = this.requestConfig
    const {
      parameterSets,
      sql,
    } = {
      ...this.requestConfig,
      ...options,
    }
    return this.dataApi.batchExecuteStatement({
      database,
      resourceArn,
      parameterSets,
      schema,
      secretArn,
      sql,
      transactionId,
    })
  }
}

export = Transaction
