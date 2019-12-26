import * as Serverless from 'serverless'
import DataAPILocalServerless = require('.')
import { dataApiLocal } from 'data-api-local'

const mockedServerInstance = {
  stop: jest.fn()
}

jest.mock('data-api-local', () => ({
  __esModule: true,
  dataApiLocal: jest.fn(() => mockedServerInstance)
}))

const serverless = new Serverless()
const config = serverless.service.custom['data-api-local'] = {
  server: {
    hostname: 'localhost',
    port: 8081
  },
  database: {
    engine: 'postgresql',
    port: 54320,
    user: 'test',
    password: 'test'
  }
}
const plugin = new DataAPILocalServerless(serverless)

describe('hooks', () => {
  beforeAll(async () => {
    await plugin.hooks['before:offline:start:init']()
  })
  test('before:offline:start:init', async () => {
    expect(dataApiLocal).toHaveBeenCalledWith(config)
  })

  test('before:offline:start:end', async () => {
    await plugin.hooks['before:offline:start:end']()
    expect(mockedServerInstance.stop).toHaveBeenCalled()
  })
})
