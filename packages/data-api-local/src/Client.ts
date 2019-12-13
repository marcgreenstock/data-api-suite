import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'

export interface ExecuteStatementRequest {
  sql: RDSDataService.Types.SqlStatement;
  parameters?: RDSDataService.Types.SqlParametersList;
}

export abstract class Client {
  abstract async connect (): Promise<Client>

  abstract async disconnect (): Promise<void>

  abstract async beginTransaction (): Promise<void>

  abstract async commitTransaction (): Promise<void>

  abstract async rollbackTransaction (): Promise<void>

  abstract async query (params: ExecuteStatementRequest): Promise<RDSDataService.Types.ExecuteStatementResponse>
}

export class QueryError extends Error {}
