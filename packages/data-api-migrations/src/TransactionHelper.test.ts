import { MigrationHelper } from './MigrationHelper'
import { TransactionHelper } from './TransactionHelper'
import { Migration } from './Migration'
import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'

const migrationHelperMocks = {
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

jest.mock('./MigrationHelper', () => {
  return {
    MigrationHelper: jest.fn().mockImplementation(() => {
      return {
        ...migrationHelperMocks
      }
    })
  }
})

beforeEach(() => {
  Object.values(migrationHelperMocks).forEach((mock) => mock.mockClear())
})

const migration = new Migration({
  id: 20200107142955,
  path: `${process.cwd()}/.migrations/20200107142955_myTest.ts`,
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


const migrationHelper = new MigrationHelper(migration)
const transactionId = 'whatever'
const helper = new TransactionHelper(migrationHelper, transactionId)

describe('.commit', () => {
  it ('calls commitTransaction on the MigrationHelper instance', async () => {
    await helper.commit()
    expect(migrationHelperMocks.commitTransaction)
      .toHaveBeenCalledWith({ transactionId })
  })
})

describe('.rollbackTransaction', () => {
  it ('calls commitTransaction on the MigrationHelper instance', async () => {
    await helper.rollback()
    expect(migrationHelperMocks.rollbackTransaction)
      .toHaveBeenCalledWith({ transactionId })
  })
})

describe('.executeStatement', () => {
  it ('calls executeStatement on the MigrationHelper instance', async () => {
    const sql = 'SELECT * FROM users WHERE id = :id'
    const parameters = [{
      name: 'id',
      value: {
        doubleValue: 42
      }
    }]
    const transactionId = 'whatever'
    await helper.executeStatement({ sql, parameters })
    expect(migrationHelperMocks.executeStatement)
      .toHaveBeenCalledWith({
        sql,
        parameters,
        transactionId,
      })
  })
})

describe('.batchExecuteStatement', () => {
  it ('calls batchExecuteStatement on the MigrationHelper instance', async () => {
    const sql = 'INSERT INTO users (email) VALUES (:email)'
    const parameterSets = [[{
      name: 'email',
      value: {
        stringValue: 'example@example.com'
      }
    }]]
    const transactionId = 'whatever'
    await helper.batchExecuteStatement({ sql, parameterSets })
    expect(migrationHelperMocks.batchExecuteStatement)
      .toHaveBeenCalledWith({
        sql,
        parameterSets,
        transactionId
      })
  })
})