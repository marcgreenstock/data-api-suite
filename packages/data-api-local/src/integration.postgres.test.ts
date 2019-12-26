import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'
import * as uuid from 'uuid/v4'
import { dataApiLocal, Server } from '.'

const DATABASE = 'test'
const SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:123456789012:secret:dummy'
const RESOURCE_ARN = 'arn:aws:rds:us-east-1:123456789012:cluster:dummy'

let server: Server
let client: RDSDataService

// executeStatement helper
const executeStatement = async (
  sql: string,
  options?: {
    parameters?: RDSDataService.Types.SqlParametersList;
    transactionId?: string;
    includeResultMetadata?: boolean;
  }
): Promise<RDSDataService.Types.ExecuteStatementResponse> => {
  const {
    parameters,
    transactionId,
    includeResultMetadata = true
  } = options || {}
  return await client.executeStatement({
    sql,
    parameters,
    includeResultMetadata,
    database: DATABASE,
    secretArn: SECRET_ARN,
    resourceArn: RESOURCE_ARN,
    transactionId
  }).promise()
}

// batchExecuteStatement helper
const batchExecuteStatement = async (
  sql: string,
  options?: {
    parameterSets?: RDSDataService.Types.SqlParameterSets;
    transactionId?: string;
    includeResultMetadata?: boolean;
  }
): Promise<RDSDataService.Types.BatchExecuteStatementResponse> => {
  const {
    parameterSets,
    transactionId
  } = options || {}
  return await client.batchExecuteStatement({
    sql,
    parameterSets,
    transactionId,
    database: DATABASE,
    secretArn: SECRET_ARN,
    resourceArn: RESOURCE_ARN,
  }).promise()
}

// executeSQL helper
const executeSql = async (
  sqlStatements: string
): Promise<RDSDataService.Types.ExecuteSqlResponse> => {
  return await client.executeSql({
    sqlStatements,
    awsSecretStoreArn: SECRET_ARN,
    dbClusterOrInstanceArn: RESOURCE_ARN,
    database: DATABASE
  }).promise()
}

// beginTransaction helper
const beginTransaction = async (): Promise<string> => {
  const { transactionId } = await client.beginTransaction({
    database: DATABASE,
    secretArn: SECRET_ARN,
    resourceArn: RESOURCE_ARN
  }).promise()
  return transactionId
}

// commitTransaction helper
const commitTransaction = async (
  transactionId: string
): Promise<RDSDataService.Types.CommitTransactionResponse> => {
  return await client.commitTransaction({
    transactionId,
    secretArn: SECRET_ARN,
    resourceArn: RESOURCE_ARN
  }).promise()
}

// rollbackTransaction helper
const rollbackTransaction = async (
  transactionId: string
): Promise<RDSDataService.Types.RollbackTransactionResponse> => {
  return await client.rollbackTransaction({
    transactionId,
    secretArn: SECRET_ARN,
    resourceArn: RESOURCE_ARN
  }).promise()
}

beforeAll(async () => {
  server = await dataApiLocal({
    logger: () => undefined,
    server: {
      hostname: 'localhost',
      port: 8080
    },
    database: {
      engine: 'postgresql',
      port: 54320,
      user: 'test',
      password: 'test'
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

beforeEach(async () => {
  await executeStatement(`DROP TABLE IF EXISTS "users"`)
  await executeStatement(`
    CREATE TABLE "users" (
      "id" SERIAL PRIMARY KEY,
      "email" character varying NOT NULL,
      "createdAt" timestamp without time zone NOT NULL,
      "updatedAt" timestamp without time zone NOT NULL
    )
  `)
})

afterEach(async () => {
  await executeStatement(`DROP TABLE IF EXISTS "users"`)
})

describe('#executeStatement', () => {
  describe('error handeling', () => {
    test('empty sql', async () => {
      try {
        await executeStatement('')
      } catch (error) {
        expect(error).toMatchObject({
          message: 'SQL is empty',
          code: 'BadRequestException'
        })
      }
    })

    test('unrecognised transaction id', async () => {
      const transactionId = uuid()
      try {
        await executeStatement('SELECT 1', { transactionId })
      } catch (error) {
        expect(error).toMatchObject({
          message: `Transaction ${transactionId} is not found`,
          code: 'BadRequestException'
        })
      }
    })
  })

  test('field metadata', async () => {
    const metadataDefaults: RDSDataService.Types.ColumnMetadata = {
      arrayBaseColumnType: 0,
      isAutoIncrement: false,
      isCaseSensitive: false,
      isCurrency: false,
      isSigned: false,
      label: '',
      name: '',
      nullable: 0,
      precision: 0,
      scale: 0,
      schemaName: '',
      tableName: '',
      type: 0,
      typeName: ''
    }
    const result = await executeStatement(`
      SELECT
        '12345'::int2 AS "int2Value",
        '12345'::int4 AS "int4Value",
        '12345'::oid AS "oidValue",
        '12345'::int8 AS "int8Value",
        '12345.67'::float4 AS "float4Value",
        '12345.67'::float8 AS "float8Value",
        '12345.67'::numeric(10, 2) AS "numericValue",
        'helloWorld'::varchar AS "varcharValue"
    `)
    expect(result).toMatchObject({
      numberOfRecordsUpdated: 0,
      records: [[
        { longValue: 12345 },
        { longValue: 12345 },
        { stringValue: '12345' },
        { longValue: 12345 },
        { doubleValue: 12345.7 },
        { doubleValue: 12345.67 },
        { stringValue: '12345.67' },
        { stringValue: 'helloWorld' }
      ]],
      columnMetadata: [{
        ...metadataDefaults,
        precision: 5,
        type: 21,
        isSigned: true,
        name: 'int2Value',
        label: 'int2Value',
        typeName: 'int2'
      }, {
        ...metadataDefaults,
        precision: 10,
        type: 23,
        isSigned: true,
        name: 'int4Value',
        label: 'int4Value',
        typeName: 'int4'
      }, {
        ...metadataDefaults,
        precision: 10,
        type: 26,
        isSigned: true,
        name: 'oidValue',
        label: 'oidValue',
        typeName: 'oid'
      }, {
        ...metadataDefaults,
        precision: 19,
        type: 20,
        isSigned: true,
        name: 'int8Value',
        label: 'int8Value',
        typeName: 'int8'
      }, {
        ...metadataDefaults,
        precision: 8,
        scale: 8,
        type: 700,
        isSigned: true,
        name: 'float4Value',
        label: 'float4Value',
        typeName: 'float4'
      }, {
        ...metadataDefaults,
        precision: 17,
        scale: 17,
        type: 701,
        isSigned: true,
        name: 'float8Value',
        label: 'float8Value',
        typeName: 'float8'
      }, {
        ...metadataDefaults,
        precision: 10,
        scale: 2,
        type: 1700,
        isSigned: true,
        name: 'numericValue',
        label: 'numericValue',
        typeName: 'numeric'
      }, {
        ...metadataDefaults,
        precision: 2147483647,
        scale: 0,
        type: 1043,
        name: 'varcharValue',
        label: 'varcharValue',
        typeName: 'varchar'
      }]
    })
  })

  describe('transactions', () => {
    let transactionId: string
    beforeEach(async () => {
      const now = new Date()
      transactionId = await beginTransaction()
      await executeStatement(`
        INSERT INTO "users" ("email", "createdAt", "updatedAt")
          VALUES (:email, :createdAt, :updatedAt)
          RETURNING *
      `, {
        transactionId,
        parameters: [{
          name: 'email',
          value: {
            stringValue: 'example@example.com'
          }
        }, {
          name: 'createdAt',
          typeHint: 'TIMESTAMP',
          value: {
            stringValue: now.toISOString()
          }
        }, {
          name: 'updatedAt',
          typeHint: 'TIMESTAMP',
          value: {
            stringValue: now.toISOString()
          }
        }]
      })
    })

    test('commiting', async () => {
      const result1 = await executeStatement('SELECT count(*) FROM "users"')
      expect(result1.records).toMatchObject([[{ longValue: 0 }]])

      await commitTransaction(transactionId)
      const result2 = await executeStatement('SELECT count(*) FROM "users"')
      expect(result2.records).toMatchObject([[{ longValue: 1 }]])
    })

    test('rolling back', async () => {
      await rollbackTransaction(transactionId)
      const result = await executeStatement('SELECT count(*) FROM "users"')
      expect(result.records).toMatchObject([[{ longValue: 0 }]])
    })
  })
})

describe('#batchExecuteStatement', () => {
  const sql = `
    INSERT INTO "users" ("email", "createdAt", "updatedAt")
      VALUES (:email, :createdAt, :updatedAt)
      RETURNING *
  `
  const now = new Date()
  const parameterSets = [
    'example1@example.com',
    'example2@example.com',
    'example3@example.com'
  ].map((stringValue) => [{
    name: 'email',
    value: {
      stringValue
    }
  }, {
    name: 'createdAt',
    typeHint: 'TIMESTAMP',
    value: {
      stringValue: now.toISOString()
    }
  }, {
    name: 'updatedAt',
    typeHint: 'TIMESTAMP',
    value: {
      stringValue: now.toISOString()
    }
  }])

  describe('error handeling', () => {
    test('empty sql', async () => {
      try {
        await batchExecuteStatement('')
      } catch (error) {
        expect(error).toMatchObject({
          message: 'SQL is empty',
          code: 'BadRequestException'
        })
      }
    })

    test('unrecognised transaction id', async () => {
      const transactionId = uuid()
      try {
        await batchExecuteStatement('SELECT 1', { transactionId })
      } catch (error) {
        expect(error).toMatchObject({
          message: `Transaction ${transactionId} is not found`,
          code: 'BadRequestException'
        })
      }
    })
  })

  test('multiple inserts', async () => {
    await batchExecuteStatement(sql, { parameterSets })
    const result = await executeStatement('SELECT count(*) FROM "users"')
    expect(result.records).toMatchObject([[{ longValue: parameterSets.length }]])
  })

  describe('transactions', () => {
    let transactionId: string
    beforeEach(async () => {
      transactionId = await beginTransaction()
      await batchExecuteStatement(sql, { parameterSets, transactionId })
    })

    test('commiting', async () => {
      const result1 = await executeStatement('SELECT count(*) FROM "users"')
      expect(result1.records).toMatchObject([[{ longValue: 0 }]])

      await commitTransaction(transactionId)
      const result2 = await executeStatement('SELECT count(*) FROM "users"')
      expect(result2.records).toMatchObject([[{ longValue: parameterSets.length }]])
    })

    test('rolling back', async () => {
      await rollbackTransaction(transactionId)
      const result = await executeStatement('SELECT count(*) FROM "users"')
      expect(result.records).toMatchObject([[{ longValue: 0 }]])
    })
  })
})

describe('#executeSql', () => {
  test('executeSql', async () => {
    await executeSql(`SELECT 1 as value; SELECT 2 as value`)
  })
})
