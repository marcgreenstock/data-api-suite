import { Migration } from './Migration'
import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'

const rdsDataServiceMocks = {
  executeStatement: jest.fn(() => {
    return {
      promise: jest.fn(() => Promise.resolve())
    }
  })
}

const executeStatementMock = jest.fn(() => Promise.resolve())

jest.mock('./MigrationHelper', () => {
  return {
    MigrationHelper: jest.fn().mockImplementation(() => ({
      executeStatement: executeStatementMock
    }))
  }
})

jest.mock('aws-sdk/clients/rdsdataservice', () => {
  return jest.fn().mockImplementation(() => {
    return {
      ...rdsDataServiceMocks
    }
  })
})

const defaultProps = {
  id: 20200107142955,
  filePath: `${__dirname}/__fixtures__/20200107142955_myTest.js`,
  fileName: '20200107142955_myTest',
  isApplied: false,
  client: new RDSDataService(),
  logger: (): void => undefined,
  methodConfig: {
    secretArn: 'example',
    resourceArn: 'example',
    database: 'example'
  }
}

beforeEach(() => {
  executeStatementMock.mockClear()
  Object.values(rdsDataServiceMocks).forEach((mock) => mock.mockClear())
})

describe('.apply', () => {
  it ('does not call executeStatement on the RDSDataService client if already applied', async () => {
    const migration = new Migration({
      ...defaultProps,
      isApplied: true
    })
    await migration.apply()
    expect(executeStatementMock).not.toHaveBeenCalled()
    expect(rdsDataServiceMocks.executeStatement).not.toHaveBeenCalled()
  })

  it ('calls the up method on the migration file', async () => {
    const migration = new Migration({ ...defaultProps })
    await migration.apply()
    expect(executeStatementMock)
      .toHaveBeenCalledWith({ sql: 'CREATE TABLE users (id int, email varchar)' })
  })

  it ('inserts the id into the migrations meta-table', async () => {
    const migration = new Migration({ ...defaultProps })
    await migration.apply()
    expect(rdsDataServiceMocks.executeStatement).toHaveBeenCalledWith({
      ...migration.methodConfig,
      sql: 'INSERT INTO __migrations__ (id) VALUES :id',
      parameters: [{
        name: 'id',
        value: {
          longValue: migration.id
        }
      }]
    })
  })
})

describe('.rollback', () => {
  it ('does not call executeStatement on the RDSDataService client if it has not beeen applied', async () => {
    const migration = new Migration({
      ...defaultProps,
      isApplied: false
    })
    await migration.rollback()
    expect(executeStatementMock).not.toHaveBeenCalled()
    expect(rdsDataServiceMocks.executeStatement).not.toHaveBeenCalled()
  })

  it ('calls the up method on the migration file', async () => {
    const migration = new Migration({ ...defaultProps, isApplied: true })
    await migration.rollback()
    expect(executeStatementMock)
      .toHaveBeenCalledWith({ sql: 'DROP TABLE users' })
  })

  it ('deletes the id from the migrations meta-table', async () => {
    const migration = new Migration({ ...defaultProps, isApplied: true })
    await migration.rollback()
    expect(rdsDataServiceMocks.executeStatement).toHaveBeenCalledWith({
      ...migration.methodConfig,
      sql: 'DELETE FROM __migrations__ WHERE id = :id',
      parameters: [{
        name: 'id',
        value: {
          longValue: migration.id
        }
      }]
    })
  })
})