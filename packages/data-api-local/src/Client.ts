import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'

export interface ExecuteSqlRequest {
  sqlStatements: RDSDataService.Types.SqlStatement;
  schema?: string;
}

export interface ExecuteStatementRequest {
  sql: RDSDataService.Types.SqlStatement;
  schema?: string;
  parameters?: RDSDataService.Types.SqlParametersList;
  includeResultMetadata?: boolean;
}

export interface BatchExecuteStatementRequest {
  sql: RDSDataService.Types.SqlStatement;
  schema?: string;
  parameterSets?: RDSDataService.Types.SqlParameterSets;
}

export abstract class Client {
  abstract async connect (): Promise<Client>

  abstract async disconnect (): Promise<void>

  abstract async beginTransaction (schema?: string): Promise<void>

  abstract async commitTransaction (): Promise<void>

  abstract async rollbackTransaction (): Promise<void>

  abstract async executeSql(
    params: ExecuteSqlRequest
  ): Promise<RDSDataService.Types.ExecuteSqlResponse>

  abstract async executeStatement (
    params: ExecuteStatementRequest
  ): Promise<RDSDataService.Types.ExecuteStatementResponse>

  abstract async batchExecuteStatement (
    params: BatchExecuteStatementRequest
  ): Promise<RDSDataService.Types.BatchExecuteStatementResponse>
}

export class QueryError extends Error {}
