import * as Serverless from 'serverless'
import DataAPILocalServerless from '.'

const serverless = new Serverless()
serverless.service.custom['data-api-local'] = {
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

beforeAll(async () => {
  await plugin.hooks['before:offline:start:init']()
})

afterAll(async () => {
  await plugin.hooks['before:offline:start:end']()
})

test('something', () => {
  console.log('hi')
})
