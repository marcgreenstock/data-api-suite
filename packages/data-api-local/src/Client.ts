import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'

export interface ExecuteSqlRequest {
  sqlStatements: RDSDataService.Types.SqlStatement
}

export interface ExecuteStatementRequest {
  sql: RDSDataService.Types.SqlStatement
  parameters?: RDSDataService.Types.SqlParametersList
  includeResultMetadata?: boolean
}

export interface BatchExecuteStatementRequest {
  sql: RDSDataService.Types.SqlStatement
  parameterSets?: RDSDataService.Types.SqlParameterSets
}

export interface Client {
  connect: () => Promise<Client>

  disconnect: () => Promise<void>

  beginTransaction: () => Promise<void>

  commitTransaction: () => Promise<void>

  rollbackTransaction: () => Promise<void>

  executeSql: (
    params: ExecuteSqlRequest
  ) => Promise<RDSDataService.Types.ExecuteSqlResponse>

  executeStatement: (
    params: ExecuteStatementRequest
  ) => Promise<RDSDataService.Types.ExecuteStatementResponse>

  batchExecuteStatement: (
    params: BatchExecuteStatementRequest
  ) => Promise<RDSDataService.Types.BatchExecuteStatementResponse>
}

export class QueryError extends Error {}
