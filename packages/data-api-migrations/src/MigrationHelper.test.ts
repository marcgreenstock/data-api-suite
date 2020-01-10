import { MigrationHelper } from './MigrationHelper'
import { TransactionHelper } from './TransactionHelper'
import { Migration } from './Migration'
import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'

const rdsDataServiceMocks = {
  beginTransaction: jest.fn(() => ({
    promise: jest.fn(() => Promise.resolve({ transactionId: 'whatever' }))
  })),
  commitTransaction: jest.fn(() => ({
    promise: jest.fn(() => Promise.resolve())
  })),
  rollbackTransaction: jest.fn(() => ({
    promise: jest.fn(() => Promise.resolve())
  })),
  executeStatement: jest.fn(() => {
    return {
      promise: jest.fn(() => Promise.resolve())
    }
  }),
  batchExecuteStatement: jest.fn(() => {
    return {
      promise: jest.fn(() => Promise.resolve())
    }
  })
}

jest.mock('aws-sdk/clients/rdsdataservice', () => {
  return jest.fn().mockImplementation(() => {
    return {
      ...rdsDataServiceMocks
    }
  })
})

beforeEach(() => {
  Object.values(rdsDataServiceMocks).forEach((mock) => mock.mockClear())
})

const migration = new Migration({
  id: 20200107142955,
  filePath: `${process.cwd()}/.migrations/20200107142955_myTest.ts`,
  fileName: '20200107142955_myTest',
  isApplied: false,
  client: new RDSDataService(),
  logger: (): void => undefined,
  methodConfig: {
    secretArn: 'example',
    resourceArn: 'example',
    database: 'example'
  }
})
const helper = new MigrationHelper(migration)

describe('.beginTransaction', () => {
  it ('calls beginTransaction on the RDSDataService client', async () => {
    await helper.beginTransaction()
    expect(rdsDataServiceMocks.beginTransaction)
      .toHaveBeenCalledWith(migration.methodConfig)
  })

  it ('returns a new TransactionHelper instance', async () => {
    const result = await helper.beginTransaction()
    expect(result).toBeInstanceOf(TransactionHelper)
    expect(result.id).toEqual('whatever')
    expect(result.migrationHelper).toEqual(helper)
  })
})

describe('.commitTransaction', () => {
  it ('calls commitTransaction on the RDSDataService client', async () => {
    await helper.commitTransaction({ transactionId: 'whatever' })
    expect(rdsDataServiceMocks.commitTransaction)
      .toHaveBeenCalledWith({ 
        ...migration.methodConfig, 
        transactionId: 'whatever' 
      })
  })
})

describe('.rollbackTransaction', () => {
  it ('calls commitTransaction on the RDSDataService client', async () => {
    await helper.rollbackTransaction({ transactionId: 'whatever' })
    expect(rdsDataServiceMocks.rollbackTransaction)
      .toHaveBeenCalledWith({ 
        ...migration.methodConfig, 
        transactionId: 'whatever' 
      })
  })
})

describe('.executeStatement', () => {
  it ('calls executeStatement on the RDSDataService client', async () => {
    const sql = 'SELECT * FROM users WHERE id = :id'
    const parameters = [{
      name: 'id',
      value: {
        doubleValue: 42
      }
    }]
    const transactionId = 'whatever'
    await helper.executeStatement({ sql, parameters, transactionId })
    expect(rdsDataServiceMocks.executeStatement)
      .toHaveBeenCalledWith({
        ...migration.methodConfig,
        sql,
        parameters,
        transactionId
      })
  })
})

describe('.batchExecuteStatement', () => {
  it ('calls batchExecuteStatement on the RDSDataService client', async () => {
    const sql = 'INSERT INTO users (email) VALUES (:email)'
    const parameterSets = [[{
      name: 'email',
      value: {
        stringValue: 'example@example.com'
      }
    }]]
    const transactionId = 'whatever'
    await helper.batchExecuteStatement({ sql, parameterSets, transactionId })
    expect(rdsDataServiceMocks.batchExecuteStatement)
      .toHaveBeenCalledWith({
        ...migration.methodConfig,
        sql,
        parameterSets,
        transactionId
      })
  })
})