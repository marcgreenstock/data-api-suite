import * as yup from 'yup'

export const executeSqlSchema = yup.object({
  awsSecretStoreArn: yup.string().required(),
  dbClusterOrInstanceArn: yup.string().required(),
  sqlStatements: yup.string().required(),
  database: yup.string().default(''),
  schema: yup.string().default('')
})

export const arrayValueSchema = yup.object({
  arrayValues: yup.array(yup.lazy(() => arrayValueSchema)),
  booleanValues: yup.array().of(yup.boolean()),
  doubleValues: yup.array().of(yup.number()),
  longValues: yup.array().of(yup.number()),
  stringValues: yup.array().of(yup.string())
}).default(undefined)

export const parameterSchema = yup.object({
  name: yup.string(),
  typeHint: yup.string().oneOf(['DATE', 'DECIMAL', 'TIME', 'TIMESTAMP']),
  value: yup.object({
    arrayValue: arrayValueSchema,
    blobValue: yup.string(),
    booleanValue: yup.boolean(),
    doubleValue: yup.number(),
    isNull: yup.boolean(),
    longValue: yup.number(),
    stringValue: yup.string()
  })
})

export const executeStatementSchema = yup.object({
  resourceArn: yup.string().required(),
  secretArn: yup.string().required(),
  sql: yup.string().required(),
  continueAfterTimeout: yup.boolean().default(false),
  database: yup.string().default(''),
  includeResultMetadata: yup.boolean().default(false),
  parameters: yup.array(parameterSchema),
  resultSetOptions: yup.object({
    decimalReturnType: yup.string().oneOf(['DOUBLE_OR_LONG', 'STRING'])
  }),
  schema: yup.string().default(''),
  transactionId: yup.string()
})

export const batchExecuteStatementSchema = yup.object({
  resourceArn: yup.string().required(),
  secretArn: yup.string().required(),
  sql: yup.string().required(),
  continueAfterTimeout: yup.boolean().default(false),
  database: yup.string().default(''),
  includeResultMetadata: yup.boolean().default(false),
  parameterSets: yup.array(yup.array(parameterSchema)),
  resultSetOptions: yup.object({
    decimalReturnType: yup.string().oneOf(['DOUBLE_OR_LONG', 'STRING'])
  }),
  schema: yup.string().default(''),
  transactionId: yup.string()
})

export const beginTransactionSchema = yup.object({
  resourceArn: yup.string().required(),
  secretArn: yup.string().required(),
  database: yup.string().default(''),
  schema: yup.string().default('')
})

export const commitTransactionSchema = yup.object({
  resourceArn: yup.string().required(),
  secretArn: yup.string().required(),
  transactionId: yup.string().required()
})

export const rollbackTransactionSchema = commitTransactionSchema
