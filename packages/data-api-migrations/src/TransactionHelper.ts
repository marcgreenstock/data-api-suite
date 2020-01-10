import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { QueryHelper } from './QueryHelper'

export type executeStatementOptions = Omit<
  RDSDataService.ExecuteStatementRequest,
  'secretArn' | 'resourceArn' | 'transactionId'
>
export type batchExecuteStatementOptions = Omit<
  RDSDataService.BatchExecuteStatementRequest,
  'secretArn' | 'resourceArn' | 'transactionId'
>

export class TransactionHelper {
  public readonly transactionId: string
  public readonly queryHelper: QueryHelper

  constructor ({ transactionId, queryHelper }) {
    this.transactionId = transactionId
    this.queryHelper = queryHelper
  }

  public async commit (): Promise<void> {
    return this.queryHelper.commitTransaction({
      transactionId: this.transactionId 
    })
  }

  public async rollback (): Promise<void> {
    await this.queryHelper.rollbackTransaction({
      transactionId: this.transactionId 
    })
  }

  public async executeStatement (
    options: executeStatementOptions
  ): Promise<RDSDataService.ExecuteStatementResponse> {
    return await this.queryHelper.executeStatement({
      ...options,
      transactionId: this.transactionId
    })
  }

  public async batchExecuteStatement (
    options: batchExecuteStatementOptions
  ): Promise<RDSDataService.BatchExecuteStatementResponse> {
    return await this.queryHelper.batchExecuteStatement({
      ...options,
      transactionId: this.transactionId 
    })
  }
}
