import * as Serverless from 'serverless'
import DataAPIMigrationsServerless = require('.')
import DataAPIMigrations from 'data-api-migrations'
import * as chalk from 'chalk'

const generateMigrationMock = jest.fn((fileName: string) => Promise.resolve(fileName))
const applyMigrationsMock = jest.fn(() => Promise.resolve([1, 2]))
const rollbackMigrationsMock = jest.fn(() => Promise.resolve([1]))
const getAppliedMigrationIds = jest.fn(() => Promise.resolve([1, 2]))
const mockedLog = jest.fn()

jest.mock('data-api-migrations', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      return {
        generateMigration: generateMigrationMock,
        applyMigrations: applyMigrationsMock,
        rollbackMigrations: rollbackMigrationsMock,
        getAppliedMigrationIds: getAppliedMigrationIds
      }
    })
  }
})

const serverless = new Serverless()
serverless.cli = new class CLI {
  log (message: string): null {
    mockedLog(message)
    return null
  }
}

describe('migrations:create:generate', () => {
  const name = 'example'

  beforeEach(async () => {
    serverless.service.custom = {
      DataAPIMigrations: {
        production: {
          resourceArn: 'example',
          secretArn: 'example'
        }
      }
    }

    const plugin = new DataAPIMigrationsServerless(serverless, { region: 'us-east-1', stage: 'production', name })
    await plugin.hooks['migrations:create:generate']()
  })

  it ('constructs DataAPIMigrations', async () => {
    expect(DataAPIMigrations).toHaveBeenCalledWith({
      isLocal: false,
      typescript: true,
      migrationsFolder: './migrations',
      cwd: serverless.config.servicePath,
      dataAPI: serverless.service.custom.DataAPIMigrations.production,
      logger: expect.any(Function)
    })
  })

  it ('calls DataAPIMigrations#generateMigration', async () => {
    expect(generateMigrationMock).toHaveBeenCalledWith(name)
  })

  it ('logs the output', async () => {
    expect(mockedLog).toHaveBeenCalledWith(`${chalk.magentaBright('Data API Migrations:')} ${chalk.greenBright(name)} created.`)
  })
})

describe('migrations:apply:exec', () => {
  beforeEach(async () => {
    serverless.service.custom = {
      DataAPIMigrations: {
        typescript: false,
        local: {
          endpoint: 'http://localhost:8080',
          resourceArn: 'example',
          secretArn: 'example'
        }
      }
    }

    const plugin = new DataAPIMigrationsServerless(serverless, { region: 'us-east-1', stage: 'local' })
    await plugin.hooks['migrations:apply:exec']()
  })

  it ('constructs DataAPIMigrations', async () => {
    expect(DataAPIMigrations).toHaveBeenCalledWith({
      isLocal: true,
      typescript: false,
      migrationsFolder: './migrations',
      cwd: serverless.config.servicePath,
      dataAPI: serverless.service.custom.DataAPIMigrations.local,
      logger: expect.any(Function)
    })
  })

  it ('calls DataAPIMigrations#applyMigrations', async () => {
    expect(applyMigrationsMock).toHaveBeenCalled()
  })

  it ('logs the output', async () => {
    expect(mockedLog).toHaveBeenCalledWith(`${chalk.magentaBright('Data API Migrations:')} ${chalk.greenBright('1')} applied.`)
    expect(mockedLog).toHaveBeenCalledWith(`${chalk.magentaBright('Data API Migrations:')} ${chalk.greenBright('2')} applied.`)
  })
})

describe('migrations:rollback:exec', () => {
  beforeEach(async () => {
    serverless.service.custom = {
      DataAPIMigrations: {
        typescript: false,
        local: {
          endpoint: 'http://localhost:8080',
          resourceArn: 'example',
          secretArn: 'example'
        }
      }
    }

    const plugin = new DataAPIMigrationsServerless(serverless, { region: 'us-east-1', stage: 'local' })
    await plugin.hooks['migrations:rollback:exec']()
  })

  it ('constructs DataAPIMigrations', async () => {
    expect(DataAPIMigrations).toHaveBeenCalledWith({
      isLocal: true,
      typescript: false,
      migrationsFolder: './migrations',
      cwd: serverless.config.servicePath,
      dataAPI: serverless.service.custom.DataAPIMigrations.local,
      logger: expect.any(Function)
    })
  })

  it ('calls DataAPIMigrations#rollbackMigrations', async () => {
    expect(rollbackMigrationsMock).toHaveBeenCalled()
  })

  it ('logs the output', async () => {
    expect(mockedLog).toHaveBeenCalledWith(`${chalk.magentaBright('Data API Migrations:')} ${chalk.greenBright('1')} rolled back.`)
  })
})

describe('migrations:status:exec', () => {
  beforeEach(async () => {
    serverless.service.custom = {
      DataAPIMigrations: {
        typescript: false,
        local: {
          endpoint: 'http://localhost:8080',
          resourceArn: 'example',
          secretArn: 'example'
        }
      }
    }

    const plugin = new DataAPIMigrationsServerless(serverless, { region: 'us-east-1', stage: 'local' })
    await plugin.hooks['migrations:status:exec']()
  })

  it ('constructs DataAPIMigrations', async () => {
    expect(DataAPIMigrations).toHaveBeenCalledWith({
      isLocal: true,
      typescript: false,
      migrationsFolder: './migrations',
      cwd: serverless.config.servicePath,
      dataAPI: serverless.service.custom.DataAPIMigrations.local,
      logger: expect.any(Function)
    })
  })

  it ('calls DataAPIMigrations#getAppliedMigrationIds', async () => {
    expect(getAppliedMigrationIds).toHaveBeenCalled()
  })

  it ('logs the output', async () => {
    expect(mockedLog).toHaveBeenCalledWith(`${chalk.magentaBright('Data API Migrations:')} ${chalk.greenBright('1')} is applied.`)
    expect(mockedLog).toHaveBeenCalledWith(`${chalk.magentaBright('Data API Migrations:')} ${chalk.greenBright('2')} is applied.`)
  })
})