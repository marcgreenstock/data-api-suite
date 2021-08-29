import * as Transaction from './Transaction'
import * as AuroraDataAPI from './AuroraDataAPI'

jest.mock('./AuroraDataAPI')

const requestConfig: AuroraDataAPI.RequestConfig = {
  continueAfterTimeout: true,
  database: 'example',
  resourceArn: 'arn:aws:rds:us-east-1:123456789012:cluster:example',
  resultSetOptions: {
    decimalReturnType: 'DOUBLE_OR_LONG',
  },
  schema: 'example',
  secretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:example',
}

const client = new AuroraDataAPI(requestConfig) as jest.Mocked<AuroraDataAPI>
beforeEach(() => {
  client.beginTransaction = jest
    .fn()
    .mockResolvedValue(new Transaction(client, 'whatever', requestConfig))
  client.commitTransaction = jest
    .fn()
    .mockResolvedValue({ transactionStatus: 'commited' })
  client.rollbackTransaction = jest
    .fn()
    .mockResolvedValue({ transactionStatus: 'rolledback' })
  client.query = jest.fn().mockResolvedValue({})
  client.batchQuery = jest.fn().mockResolvedValue({})
  client.executeStatement = jest.fn().mockResolvedValue({})
  client.batchExecuteStatement = jest.fn().mockResolvedValue({})
})

describe('AuroraDataAPITransaction#commit', () => {
  it('calls #commitTransaction on the AuroraDataAPI instance', async () => {
    const transaction = await client.beginTransaction()
    const { resourceArn, secretArn } = requestConfig
    await transaction.commit()
    expect(client.commitTransaction).toHaveBeenCalledWith(
      transaction.transactionId,
      {
        resourceArn,
        secretArn,
      }
    )
  })
})

describe('AuroraDataAPITransaction#rollback', () => {
  it('calls #rollbackTransaction on the AuroraDataAPI instance', async () => {
    const transaction = await client.beginTransaction()
    const { resourceArn, secretArn } = requestConfig
    await transaction.rollback()
    expect(client.rollbackTransaction).toHaveBeenCalledWith(
      transaction.transactionId,
      {
        resourceArn,
        secretArn,
      }
    )
  })
})

describe('AuroraDataAPITransaction#query', () => {
  it('calls #query on the on the AuroraDataAPI instance', async () => {
    const transaction = await client.beginTransaction()
    const sql = 'SELECT * FROM users'
    const params = { id: 27 }
    const {
      continueAfterTimeout,
      database,
      resourceArn,
      resultSetOptions,
      schema,
      secretArn,
    } = {
      ...requestConfig,
    }
    await transaction.query(sql, params)
    expect(client.query).toHaveBeenCalledWith(sql, params, {
      transactionId: transaction.transactionId,
      continueAfterTimeout,
      database,
      resourceArn,
      resultSetOptions,
      schema,
      secretArn,
    })
  })
})

describe('AuroraDataAPITransaction#batchQuery', () => {
  it('calls #batchQuery on the on the AuroraDataAPI instance', async () => {
    const transaction = await client.beginTransaction()
    const sql = 'SELECT * FROM users where id = :id'
    const params = [{ id: 19 }]
    const { database, resourceArn, schema, secretArn } = requestConfig
    await transaction.batchQuery(sql, params)
    expect(client.batchQuery).toHaveBeenCalledWith(sql, params, {
      transactionId: transaction.transactionId,
      database,
      resourceArn,
      schema,
      secretArn,
    })
  })
})

describe('AuroraDataAPITransaction#executeStatement', () => {
  it('calls #executeStatement on the on the AuroraDataAPI instance', async () => {
    const transaction = await client.beginTransaction()
    const sql = 'SELECT * FROM users where id = :id'
    const parameters = [
      {
        name: 'id',
        value: {
          longValue: 88,
        },
      },
    ]
    const {
      continueAfterTimeout,
      database,
      resourceArn,
      resultSetOptions,
      schema,
      secretArn,
    } = requestConfig
    await transaction.executeStatement({ sql, parameters })
    expect(client.executeStatement).toHaveBeenCalledWith({
      transactionId: transaction.transactionId,
      parameters,
      sql,
      continueAfterTimeout,
      database,
      resourceArn,
      resultSetOptions,
      schema,
      secretArn,
    })
  })
})

describe('AuroraDataAPITransaction#batchExecuteStatement', () => {
  it('calls #batchExecuteStatement on the on the AuroraDataAPI instance', async () => {
    const transaction = await client.beginTransaction()
    const sql = 'SELECT * FROM users where id = :id'
    const parameterSets = [
      [
        {
          name: 'id',
          value: {
            longValue: 99,
          },
        },
      ],
    ]
    const { database, resourceArn, schema, secretArn } = requestConfig
    await transaction.batchExecuteStatement({ sql, parameterSets })
    expect(client.batchExecuteStatement).toHaveBeenCalledWith({
      transactionId: transaction.transactionId,
      parameterSets,
      sql,
      database,
      resourceArn,
      schema,
      secretArn,
    })
  })
})
