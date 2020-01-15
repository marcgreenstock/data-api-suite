import * as AuroraDataAPI from './AuroraDataAPI'

declare namespace AuroraDataAPITransaction {
  export type QueryOptions = Pick<
    AuroraDataAPI.QueryOptions, 
    'continueAfterTimeout' | 'includeResultMetadata' | 'resultSetOptions' | 'stringParsers'
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

class AuroraDataAPITransaction {
  public isComplete: boolean
  public readonly dataApi: AuroraDataAPI
  public readonly transactionId: string

  constructor (dataApi: AuroraDataAPI, transactionId: string) {
    this.isComplete = false
    this.dataApi = dataApi
    this.transactionId = transactionId
  }

  /**
   * Performs a commit of the transaction.
   */
  public async commit (): Promise<AuroraDataAPI.CommitTransactionResult> {
    const result = await this.dataApi.commitTransaction(this.transactionId)
    this.isComplete = true
    return result
  }

  /**
   * Performs a rollback of the transaction and cancels its changes.
   */
  public async rollback (): Promise<AuroraDataAPI.RollbackTransactionResult> {
    const result =  await this.dataApi.rollbackTransaction(this.transactionId)
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
    options?: AuroraDataAPITransaction.QueryOptions
  ): Promise<AuroraDataAPI.QueryResult<T>> {
    const {
      continueAfterTimeout,
      includeResultMetadata,
      resultSetOptions,
      stringParsers,
    } = { ...options }
    return this.dataApi.query(sql, params, {
      continueAfterTimeout,
      includeResultMetadata,
      resultSetOptions,
      stringParsers,
      transactionId: this.transactionId,
    })
  }

  public async batchQuery  (
    sql: string,
    params?: AuroraDataAPI.QueryParams[],
  ): Promise<AuroraDataAPI.BatchQueryResult> {
    return this.dataApi.batchQuery(sql, params, {
      transactionId: this.transactionId,
    })
  }

  public async executeStatement (
    options: AuroraDataAPITransaction.ExecuteStatementOptions
  ): Promise<AuroraDataAPI.ExecuteStatementResult> {
    const {
      continueAfterTimeout,
      includeResultMetadata,
      parameters,
      resultSetOptions,
      sql,
    } = options
    return this.dataApi.executeStatement({
      continueAfterTimeout,
      includeResultMetadata,
      parameters,
      resultSetOptions,
      sql,
      transactionId: this.transactionId,
    })
  }

  public async batchExecuteStatement (
    options: AuroraDataAPITransaction.BatchExecuteStatementOptions
  ): Promise<AuroraDataAPI.BatchExecuteStatementResult> {
    const {
      parameterSets,
      sql,
    } = options
    return this.dataApi.batchExecuteStatement({
      parameterSets,
      sql,
      transactionId: this.transactionId,
    })
  }
}

export = AuroraDataAPITransaction