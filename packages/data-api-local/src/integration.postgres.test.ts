import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { dataApiLocal, Server } from '.'

describe('dataApiLocal', () => {
  const database = 'test'
  const secretArn = 'arn:aws:secretsmanager:us-east-1:123456789012:secret:dummy'
  const resourceArn = 'arn:aws:rds:us-east-1:123456789012:cluster:dummy'
  let server: Server
  let client: RDSDataService

  beforeAll(async () => {
    server = await dataApiLocal({
      engine: 'postgres',
      port: 54320,
      user: 'test',
      password: 'test',
      server: {
        hostname: 'localhost',
        port: 8080
      }
    })
    client = new RDSDataService({
      endpoint: 'http://localhost:8080',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'example',
        secretAccessKey: 'example'
      }
    })
  })

  afterAll(async () => {
    await server.stop()
  })

  describe('executeStatement outsite of a transaction', () => {
    it ('returns the result', async () => {
      const sql = 'SELECT * FROM "test";'
      const result = await client.executeStatement({
        sql,
        database,
        secretArn,
        resourceArn
      }).promise()
      console.log(JSON.stringify(result, undefined, 2))
    })
  })

  describe('executeStatement in a transaction', () => {
    it ('commits the transaction', async () => {
      const { transactionId } = await client.beginTransaction({
        database,
        secretArn,
        resourceArn
      }).promise()
      const result = await client.executeStatement({
        transactionId,
        sql: 'INSERT INTO "test" ("nonNullString", "integer") VALUES (:nonNullString, :integer) RETURNING id',
        database,
        secretArn,
        resourceArn,
        parameters: [{
          name: 'nonNullString',
          value: {
            stringValue: 'whatever'
          }
        }, {
          name: 'integer',
          value: {
            longValue: 42
          }
        }]
      }).promise()
      console.log(result)
      const commit = await client.commitTransaction({
        transactionId,
        secretArn,
        resourceArn
      }).promise()
      console.log(commit)
    })
  })
})
