import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { TransactionHelper } from './TransactionHelper'

export interface QueryHelperMethodConfig {
  database?: RDSDataService.DbName;
  resourceArn: RDSDataService.Arn;
  schema?: RDSDataService.DbName;
  secretArn: RDSDataService.Arn;
}

export interface QueryHelperOptions {
  clientConfig: RDSDataService.ClientConfiguration;
  methodConfig: QueryHelperMethodConfig;
  logger: Function;
}

export type beginTransactionOptions = Omit<
  RDSDataService.BeginTransactionRequest,
  'secretArn' | 'resourceArn'
>
export type executeStatementOptions = Omit<
  RDSDataService.ExecuteStatementRequest,
  'secretArn' | 'resourceArn'
>
export type batchExecuteStatementOptions = Omit<
  RDSDataService.BatchExecuteStatementRequest,
  'secretArn' | 'resourceArn'
>

export class QueryHelper {
  public readonly client: RDSDataService
  public readonly methodConfig: QueryHelperMethodConfig
  public readonly logger: Function

  constructor ({
    clientConfig,
    methodConfig,
    logger
  }: QueryHelperOptions) {
    this.client = new RDSDataService(clientConfig)
    this.methodConfig = methodConfig
    this.logger = logger
  }

  public async beginTransaction (
    options?: beginTransactionOptions
  ): Promise<TransactionHelper> {
    this.logger('[beginTransaction]')
    const { transactionId } = await this.client.beginTransaction({
      ...this.methodConfig,
      ...options
    }).promise()
    return new TransactionHelper({ queryHelper: this, transactionId })
  }

  public async commitTransaction ({
    transactionId,
  }: {
    transactionId: string;
  }): Promise<void> {
    this.logger('[commitTransaction]')
    const { resourceArn, secretArn } = this.methodConfig
    await this.client.commitTransaction({
      resourceArn,
      secretArn,
      transactionId
    }).promise()
  }

  public async rollbackTransaction ({
    transactionId
  }: {
    transactionId: string;
  }): Promise<void> {
    this.logger('[rollbackTransaction]')
    const { resourceArn, secretArn } = this.methodConfig
    await this.client.rollbackTransaction({
      resourceArn,
      secretArn,
      transactionId
    }).promise()
  }

  public async executeStatement (
    options: executeStatementOptions
  ): Promise<RDSDataService.ExecuteStatementResponse> {
    const { sql } = options
    this.logger(`[executeStatement] ${sql}`)
    return await this.client.executeStatement({
      ...this.methodConfig,
      ...options
    }).promise()
  }

  public async batchExecuteStatement (
    options: batchExecuteStatementOptions
  ): Promise<RDSDataService.BatchExecuteStatementResponse> {
    const { sql } = options
    this.logger(`[batchExecuteStatement] ${sql}`)
    return await this.client.batchExecuteStatement({
      ...this.methodConfig,
      ...options
    }).promise()
  }
}