import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { MigrationManager } from '.'
import { tsTemplate, jsTemplate } from './templates'
import { format as formatDate } from 'date-fns'
import { writeFile } from 'fs-extra'

const now = Date.now()
Date.now = jest.fn(() => now)

jest.mock('fs-extra')

const methodConfig = {
  secretArn: 'example',
  resourceArn: 'example'
}
let executeStatementResponse: RDSDataService.ExecuteStatementResponse

const executeStatementMock = jest.fn(() => {
  return {
    promise: jest.fn(() => Promise.resolve(executeStatementResponse) )
  }
})

jest.mock('aws-sdk/clients/rdsdataservice', () => {
  return jest.fn().mockImplementation(() => {
    return {
      executeStatement: executeStatementMock
    }
  })
})

const tsCompilerMocks = {
  compile: jest.fn(() => Promise.resolve([
    '.migrations/20100107192311_foobar.js'
  ])),
  cleanup: jest.fn(() => Promise.resolve())
}

jest.mock('./TsCompiler', () => {
  return {
    TsCompiler: jest.fn().mockImplementation(() => tsCompilerMocks)
  }
})

const migrationMocks = {
  apply: jest.fn(() => Promise.resolve()),
  rollback: jest.fn(() => Promise.resolve())
}

jest.mock('./Migration', () => {
  return {
    Migration: jest.fn().mockImplementation(() => migrationMocks)
  }
})

describe('.generateMigration', () => {
  it('writes the ts file and returns the filename', async () => {
    const manager = new MigrationManager({
      methodConfig
    })
    const resultPath = await manager.generateMigration('foobar')
    const expectedPath = `${process.cwd()}/migrations/${formatDate(now, 'yyyyMMddHHmmss')}_foobar.ts`
    expect(writeFile).toHaveBeenCalledWith(expectedPath, tsTemplate())
    expect(resultPath).toEqual(expectedPath)
  })

  it('writes the js file and returns the filename', async () => {
    const manager = new MigrationManager({
      config: {
        typescript: false
      },
      methodConfig
    })
    const resultPath = await manager.generateMigration('foobar')
    const expectedPath = `${process.cwd()}/migrations/${formatDate(now, 'yyyyMMddHHmmss')}_foobar.js`
    expect(writeFile).toHaveBeenCalledWith(expectedPath, jsTemplate())
    expect(resultPath).toEqual(expectedPath)
  })
})

describe('.getAppliedMigrationIds', () => {
  beforeAll(() => {
    executeStatementResponse = {
      records: [
        [{ longValue: 20100107192311 }],
        [{ longValue: 20200108111532 }]
      ]
    }
  })

  it('makes an SQL query to fetch the list of applied migrations', async () => {
    const manager = new MigrationManager({
      methodConfig
    })
    await manager.getAppliedMigrationIds()
    expect(executeStatementMock).toHaveBeenCalledWith({
      ...manager.methodConfig,
      sql: 'SELECT id FROM __migrations__'
    })
  })

  it('ensures the migration table exists', async () => {
    const manager = new MigrationManager({
      methodConfig
    })
    await manager.getAppliedMigrationIds()
    expect(executeStatementMock).toHaveBeenCalledWith({
      ...manager.methodConfig,
      sql: 'CREATE TABLE IF NOT EXISTS __migrations__ (id bigint NOT NULL UNIQUE)'
    })
  })

  it('returns a list of applied migration ids', async () => {
    const manager = new MigrationManager({
      methodConfig
    })
    const result = await manager.getAppliedMigrationIds()
    expect(result).toMatchObject([20100107192311, 20200108111532])
  })
})

describe('.applyMigrations', () => {
  beforeEach(() => {
    Object.values(tsCompilerMocks).forEach((mock) => mock.mockClear())
    Object.values(migrationMocks).forEach((mock) => mock.mockClear())
  })

  it('calls compile on the compiler', async () => {
    const manager = new MigrationManager({
      methodConfig
    })
    await manager.applyMigrations()
    expect(tsCompilerMocks.compile).toHaveBeenCalled()
  })

  it('calls apply on the migrations', async () => {
    const manager = new MigrationManager({
      methodConfig
    })
    await manager.applyMigrations()
    expect(migrationMocks.apply).toHaveBeenCalled()
  })

  it('calls clean up on the compiler', async () => {
    const manager = new MigrationManager({
      methodConfig
    })
    await manager.applyMigrations()
    expect(tsCompilerMocks.cleanup).toHaveBeenCalled()
  })
})

// describe('.rollback', () => {

// })