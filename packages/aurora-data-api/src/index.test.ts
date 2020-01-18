/* eslint-disable @typescript-eslint/no-explicit-any */
import * as AuroraDataAPI from '.'
import * as Transaction from './Transaction'
import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'

jest.mock('aws-sdk/clients/rdsdataservice')

const requestConfig: AuroraDataAPI.RequestConfig = {
  continueAfterTimeout: true,
  database: 'example',
  resourceArn: 'arn:aws:rds:us-east-1:123456789012:cluster:example',
  resultSetOptions: {
    decimalReturnType: 'DOUBLE_OR_LONG'
  },
  schema: 'example',
  secretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:example',
}
const transformerOptions: AuroraDataAPI.TransformQueryResponseOptions = {
  valueTransformer: (value, metadata, next) => {
    return next()
  }
}
const clientConfig: AuroraDataAPI.ClientConfig = {
  endpoint: 'http://localhost:8080',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'example',
    secretAccessKey: 'example'
  },
  params: {
    foo: 'bar'
  }
}

let client: AuroraDataAPI
let mockedRdsClient: jest.Mocked<RDSDataService>

const setClient = (): AuroraDataAPI => {
  client = new AuroraDataAPI({
    ...requestConfig,
    ...clientConfig,
    ...transformerOptions,
  })
  mockedRdsClient = client.client as jest.Mocked<RDSDataService>
  return client
}

describe('new AuroraDataAPI', () => {
  beforeEach(setClient)

  it ('sets the requestConfig', () => {
    expect(client.requestConfig).toMatchObject(requestConfig)
  })

  it ('sets the transformOptions', () => {
    expect(client.transformOptions).toMatchObject(transformerOptions)
  })

  it ('sets the client', () => {
    expect(RDSDataService).toHaveBeenCalledWith({ apiVersion: '2018-08-01', ...clientConfig })
    expect(client.client).toBeInstanceOf(RDSDataService)
  })
})

describe('AuroraDataAPI#beginTransaction', () => {
  beforeEach(() => {
    setClient()
    mockedRdsClient.beginTransaction = jest.fn(() => ({
      promise: jest.fn().mockResolvedValue({ transactionId: 'whatever' })
    })) as any
  })

  it ('calls RDSDataService#beginTransaction and returns an instance of Transaction', async () => {
    const {
      database,
      resourceArn,
      schema,
      secretArn,
    } = requestConfig
    const result = await client.beginTransaction()
    expect(mockedRdsClient.beginTransaction).toHaveBeenCalledWith({
      database,
      resourceArn,
      schema,
      secretArn
    })
    expect(result).toBeInstanceOf(Transaction)
  })

  it ('can override the params passed to RDSDataService#beginTransaction', async () => {
    const params = {
      database: 'database',
      resourceArn: 'resourceArn',
      schema: 'schema',
      secretArn: 'secretArn',
    }
    await client.beginTransaction(params)
    expect(mockedRdsClient.beginTransaction).toHaveBeenCalledWith(params)
  })

  it ('throws an error if the transactionId is not in the resolved response', async () => {
    mockedRdsClient.beginTransaction = jest.fn(() => ({
      promise: jest.fn().mockResolvedValue({})
    })) as any
    try {
      await client.beginTransaction()
    } catch (error) {
      expect(error.message).toEqual('transactionId missing from response')
    }
  })
})

describe('AuroraDataAPI#CommitTransaction', () => {
  beforeEach(() => {
    setClient()
    mockedRdsClient.commitTransaction = jest.fn(() => ({
      promise: jest.fn().mockResolvedValue({ transactionStatus: 'commited' })
    })) as any
  })
  
  it ('calls RDSDataService#commitTransaction and returns the result', async () => {
    const {
      resourceArn,
      secretArn,
    } = requestConfig
    const transactionId = 'whatever'
    const result = await client.commitTransaction(transactionId)
    expect(mockedRdsClient.commitTransaction).toHaveBeenCalledWith({
      resourceArn,
      secretArn,
      transactionId
    })
    expect(result).toEqual({ transactionStatus: 'commited' })
  })

  it ('can override the params passed to RDSDataService#commitTransaction', async () => {
    const options = {
      resourceArn: 'resourceArn',
      secretArn: 'secretArn',
    }
    const transactionId = 'transactionId'
    await client.commitTransaction(transactionId, options)
    expect(mockedRdsClient.commitTransaction).toHaveBeenCalledWith({ transactionId, ...options })
  })
})

describe('AuroraDataAPI#rollbackTransaction', () => {
  beforeEach(() => {
    setClient()
    mockedRdsClient.rollbackTransaction = jest.fn(() => ({
      promise: jest.fn().mockResolvedValue({ transactionStatus: 'rolledback' })
    })) as any
  })
  
  it ('calls RDSDataService#rollbackTransaction and returns the result', async () => {
    const {
      resourceArn,
      secretArn,
    } = requestConfig
    const transactionId = 'whatever'
    const result = await client.rollbackTransaction(transactionId)
    expect(mockedRdsClient.rollbackTransaction).toHaveBeenCalledWith({
      resourceArn,
      secretArn,
      transactionId
    })
    expect(result).toEqual({ transactionStatus: 'rolledback' })
  })

  it ('can override the params passed to RDSDataService#rollbackTransaction', async () => {
    const options = {
      resourceArn: 'resourceArn',
      secretArn: 'secretArn',
    }
    const transactionId = 'transactionId'
    await client.rollbackTransaction(transactionId, options)
    expect(mockedRdsClient.rollbackTransaction).toHaveBeenCalledWith({ transactionId, ...options })
  })
})

describe('AuroraDataAPI#query', () => {
  const executeStatementResponse: RDSDataService.ExecuteStatementResponse = {
    records: [
      [{ longValue: 1 }, { stringValue: 'marc' }, { stringValue: '2019-12-25 19:14:33' }],
      [{ longValue: 2 }, { stringValue: 'felix' }, { stringValue: '2020-01-13 15:21:07' }],
    ],
    columnMetadata: [{
      typeName: 'int8',
      name: 'id',
    }, {
      typeName: 'varchar',
      name: 'name',
    }, {
      typeName: 'timestamp',
      name: 'createdAt',
    }],
  }

  beforeEach(() => {
    setClient()
    mockedRdsClient.executeStatement = jest.fn(() => ({
      promise: jest.fn().mockResolvedValue(executeStatementResponse)
    })) as any
  })

  it ('calls RDSDataService#executeStatement and returns the transformed result', async () => {
    const sql = 'SELECT * FROM users WHERE bar = :foo'
    const result = await client.query(sql, { foo: 'bar' })
    expect(mockedRdsClient.executeStatement).toHaveBeenCalledWith({
      ...client.requestConfig,
      includeResultMetadata: true,
      sql,
      parameters: [{
        name: 'foo',
        value: {
          stringValue: 'bar'
        }
      }],
    })
    expect(result).toMatchObject({
      ...executeStatementResponse,
      rows: [{
        id: 1,
        name: 'marc',
        createdAt: new Date('2019-12-25 19:14:33')
      }, {
        id: 2,
        name: 'felix',
        createdAt: new Date('2020-01-13 15:21:07')
      }],
      metadata: {
        id: { typeName: 'int8', name: 'id' },
        name: { typeName: 'varchar', name: 'name' },
        createdAt: { typeName: 'timestamp', name: 'createdAt' }
      }
    })
  })

  it ('just returns the raw results if includeResultMetadata is false', async () => {
    const sql = 'SELECT * FROM users'
    const result = await client.query(sql, undefined, { includeResultMetadata: false })
    expect(result).toMatchObject(executeStatementResponse)
  })
})

describe('AuroraDataAPI#batchQuery', () => {
  beforeEach(() => {
    mockedRdsClient.batchExecuteStatement = jest.fn(() => ({
      promise: jest.fn().mockResolvedValue({ updateResults: null })
    })) as any
  })

  it ('calls RDSDataService#executeBatchStatement and returns the result', async () => {
    const {
      database,
      resourceArn,
      schema,
      secretArn
    } = requestConfig
    const sql = 'INSERT INTO users (name, interests) VALUES (:name, :interests)'
    const result = await client.batchQuery(sql, [{
      name: 'sam',
      interests: ['books', 'running', 'cooking']
    }, {
      name: 'roger',
      interests: ['cats', 'dogs', 'babies']
    }])
    const parameterSets: RDSDataService.SqlParameterSets = [
      [{
        name: 'name',
        value: {
          stringValue: 'sam'
        }
      }, {
        name: 'interests',
        value: {
          arrayValue: {
            stringValues: ['books', 'running', 'cooking']
          }
        }
      }],
      [{
        name: 'name',
        value: {
          stringValue: 'roger'
        }
      }, {
        name: 'interests',
        value: {
          arrayValue: {
            stringValues: ['cats', 'dogs', 'babies']
          }
        }
      }]
    ]
    expect(mockedRdsClient.batchExecuteStatement).toHaveBeenCalledWith({
      sql,
      database,
      resourceArn,
      schema,
      secretArn,
      parameterSets,
    })
    expect(result).toMatchObject({ updateResults: null })
  })

  it ('can override the params passed to RDSDataService#rollbackTransaction', async () => {
    const params = {
      database: 'database',
      resourceArn: 'resourceArn',
      schema: 'schema',
      secretArn: 'secretArn',
      transactionId: 'transactionId'
    }
    const sql = 'INSERT INTO users (name, interests) VALUES (:name, :interests)'
    await client.batchQuery(sql, undefined, params)
    expect(mockedRdsClient.batchExecuteStatement).toHaveBeenCalledWith({
      sql,
      ...params,
    })
  })
})