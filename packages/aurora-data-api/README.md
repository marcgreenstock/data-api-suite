# AuroraDataAPI

[![Master](https://github.com/marcgreenstock/data-api-local/workflows/master/badge.svg)](https://github.com/marcgreenstock/data-api-local/actions) [![NPM](https://img.shields.io/npm/v/aurora-data-api.svg)](https://www.npmjs.com/package/aurora-data-api)

## Summary

**AuroraDataAPI** is an abstraction of the [RDSDataService](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html) that implements the [Data API for Aurora Serverless](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html).

Query requests are simplified; instead of expecting clunky query params it expects only a JSON object:

```ts
// using AuroraDataAPI
await auroraDataAPI.query('SELECT * FROM users where id = :id', { id: 42 })
```

```ts
// using RDSDataService
await rdsDataService.executeStatement({
  sql: 'SELECT * FROM users where id = :id',
  includeResultMetadata: true,
  parameters: [{
    value: {
      longValue: 42
    }
  }]
}).promise()
```

Results are also simplified by transforming the records into a ready-to-use JS object:

```ts
// response from AuroraDataAPI#query
{
  rows: [
    {
      id: 7,
      name: 'Filip J Fry'
    },
    {
      id: 9,
      name: 'Bender Bending Rodriguez'
    }
  ],
  metadata: {
    id: {
      tableName: 'users',
      name: 'id',
      typeName: 'int8',
      // ...everything else from columnMetadata
    },
    name: {
      tableName: 'users',
      name: 'name',
      typeName: 'varchar',
      // ...
    }
  },
  // ...includes the original result payload too
}
```

```ts
// response from RDSDataService#executeStatement
{
  records: [
    [
      {
        longValue: 7
      },
      {
        stringValue: 'Filip J Fry'
      }
    ],
    [
      {
        longValue: 9
      },
      {
        stringValue: 'Bender Bending Rodriguez'
      }
    ]
  ],
  columnMetadata: [
    {
      tableName: 'users',
      name: 'id',
      typeName: 'int8',
      // ...everything else from columnMetadata
    },
    {
      tableName: 'users',
      name: 'name',
      typeName: 'varchar',
      // ...
    }
  ]
}
```

## [Data API for Aurora Serverless Suite](../../#readme)

This library is part of the **[Data API for Aurora Serverless Suite](../../#readme)**, a [monorepo](https://en.wikipedia.org/wiki/Monorepo) that includes libraries, [Serverless Framework](https://serverless.com/) plugins and development tools to simplify and enhance the development, deployment and use of the [Data API for Aurora Serverless](https://aws.amazon.com/blogs/aws/new-data-api-for-amazon-aurora-serverless/) on Amazon Web Services.

## Installation

```sh
$ npm install aurora-data-api --save
```

## Usage

```ts
import * from AuroraDataAPI
const auroraDataAPI = new AuroraDataAPI({ ...config })
auroraDataAPI.query('SELECT * FROM users').then(console.log)
```

## AuroraDataAPI#constructor

```ts
new AuroraDataAPI(
  config: AuroraDataAPI.Config
) => AuroraDataAPI
```

Constructs a new instance of `AuroraDataAPI`.

#### Config

| Name | Description | Required | Default |
| ---- | ----------- | -------- | -------- |
| `resourceArn`| The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster. | Yes | `undefined` |
| `secretArn` | The name or ARN of the secret that enables access to the DB cluster. | Yes | `undefined` |
| `database` | The name of the database. | No | `undefined` |
| `schema` | The name of the database schema. | No | `undefined` |
| `includeResultMetadata` | A value that indicates whether to include metadata in the results. **Note**: must be `true` for the results to be transformed. | No | `true` |
| `continueAfterTimeout` | A value that indicates whether to continue running the statement after the call times out. By default, the statement stops running when the call times out.<br /><br />For DDL statements, we recommend continuing to run the statement after the call times out. When a DDL statement terminates before it is finished running, it can result in errors and possibly corrupted data structures. | No | `undefined` |
| `resultSetOptions` | Options that control how the result set is returned. | No | `undefined` |
| `valueTransformer` | See [Value Transformer](#Value-Transformer). | No | `undefined` |
| `...rest` | Unspecified properties (i.e. properties from `RDSDataService.ClientConfiguration`) will be used to construct the `RDSDataService` client. [See the AWS SDK docs for more info.](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#constructor-property) | Conditional - see note below. | `undefined` |

**Note**: The `RDSDataService` can be constructed without any properties, for instance when the [Global Configuration Object](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/global-config-object.html) is set.

#### Class Properties

| Name | Description |
| ---- | ----------- |
| `client` | Instance of the [`RDSDataService`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html). |
| `requestConfig` | Object containing properties to send to the [`RDSDataService`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html) methods. |

## `AuroraDataAPI` methods

| Name | Description |
| ---- | ----------- |
| [`query`](#auroradataapiquery) | Performs an SQL query. |
| [`batchQuery`](#auroradataapibatchquery) | Runs a batch SQL statement over an array of data. |
| [`beginTransaction`](#auroradataapibegintransaction) | Starts a SQL transaction. |
| [`commitTransaction`](#auroradataapicommittransaction) | Commits and ends a SQL transaction. |
| [`rollbackTransaction`](#auroradataapirollbacktransaction) | Rolls-back and ends a SQL transaction. |
| [`executeStatement`](#auroradataapiexecutestatement) | Abstraction of the [`RDSDataService#executeStatement`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#executeStatement-property) method. |
| [`batchExecuteStatement`](#auroradataapibatchexecutestatement) | Abstraction of the RDSDataService [`RDSDataService#batchExecuteStatement`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#batchExecuteStatement-property) method. |

### `AuroraDataAPI#query`

```ts
query<T = AuroraDataAPI.UnknownRow>(
  sql: string,
  params?: AuroraDataAPI.QueryParams,
  options?: AuroraDataAPI.QueryOptions
) => Promise<AuroraDataAPI.QueryResult<T>>
```

Performs an SQL statement.

The response size limit is 1 MB or 1,000 records. If the call returns more than 1 MB of response data or over 1,000 records, the call is terminated. 

#### Arguments

| Name | Description | Required |
| ---- | ----------- | -------- |
| `sql`  | The SQL query string to perform. | Yes |
| `params` | See [Query Params](#query-params). | No |
| `options` | See options below. | No |

#### Options

| Name | Description | Default |
| ---- | ----------- | ------- |
| `includeResultMetadata` | A value that indicates whether to include metadata in the results. **Note**: must be `true` for the results to be transformed. | Defined in [constructor](#auroradataapiconstructor). |
| `continueAfterTimeout` | A value that indicates whether to continue running the statement after the call times out. By default, the statement stops running when the call times out.<br /><br />For DDL statements, we recommend continuing to run the statement after the call times out. When a DDL statement terminates before it is finished running, it can result in errors and possibly corrupted data structures. | Defined in [constructor](#auroradataapiconstructor). |
| `database` | The name of the database. | Defined in [constructor](#auroradataapiconstructor). |
| `resourceArn` | The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster. | Defined in [constructor](#auroradataapiconstructor). |
| `resultSetOptions` | Options that control how the result set is returned. | Defined in [constructor](#auroradataapiconstructor). |
| `schema` | The name of the database schema. | Defined in [constructor](#auroradataapiconstructor). |
| `secretArn` | The name or ARN of the secret that enables access to the DB cluster. | Defined in [constructor](#auroradataapiconstructor). |
| `transactionId` | The identifier of a transaction that was started by using the BeginTransaction operation. Specify the transaction ID of the transaction that you want to include the SQL statement in. | `undefined` |
| `valueTransformer` | See [Value Transformer](#value-transformer). | Defined in [constructor](#auroradataapiconstructor). |

#### Further reading
- https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#executeStatement-property
- https://docs.aws.amazon.com/rdsdataservice/latest/APIReference/API_ExecuteStatement.html

### `AuroraDataAPI#batchQuery`

```ts
batchQuery(
  sql: string,
  params?: AuroraDataAPI.QueryParams[],
  options?: AuroraDataAPI.BatchQueryOptions
) => Promise<AuroraDataAPI.BatchQueryResult>
```

Runs a batch SQL statement over an array of data.

#### Arguments

| Name | Description | Required |
| ---- | ----------- | -------- |
| `sql`  | The SQL query string to perform. | Yes |
| `params` | An array of [Query Params](#query-params). Maximum of 1,000. | No |
| `options` | See options below. | No |

#### Options

| Name | Description | Default |
| ---- | ----------- | ------- |
| `database` | The name of the database. | Defined in [constructor](#auroradataapiconstructor). |
| `resourceArn` | The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster. | Defined in [constructor](#auroradataapiconstructor). |
| `schema` | The name of the database schema. | Defined in [constructor](#auroradataapiconstructor). |
| `secretArn` | The name or ARN of the secret that enables access to the DB cluster. | Defined in [constructor](#auroradataapiconstructor). |
| `transactionId` | The identifier of a transaction that was started by using the BeginTransaction operation. Specify the transaction ID of the transaction that you want to include the SQL statement in. | `undefined` |

### `AuroraDataAPI#beginTransaction`

```ts
beginTransaction(
  options?: AuroraDataAPI.BeginTransactionOptions
) => Promise<AuroraDataAPI.Transaction>
```

Starts a SQL transaction and resolves an instance of [`AuroraDataAPI.Transaction`](#auroradataapitransaction-methods).

From the [AWS SDK Docs](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#beginTransaction-property):

> <p>A transaction can run for a maximum of 24 hours. A transaction is terminated and rolled back automatically after 24 hours.</p>
> <p>A transaction times out if no calls use its transaction ID in three minutes. If a transaction times out before it's committed, it's rolled back automatically.</p>
> <p>DDL statements inside a transaction cause an implicit commit. We recommend that you run each DDL statement in a separate <code>ExecuteStatement</code> call with <code>continueAfterTimeout</code> enabled.</p>

#### Arguments

| Name | Description | Required |
| ---- | ----------- | -------- |
| `options` | See options below. | No |

#### Options

| Name | Description | Default |
| ---- | ----------- | ------- |
| `database` | The name of the database. | Defined in [constructor](#auroradataapiconstructor). |
| `resourceArn` | The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster. | Defined in [constructor](#auroradataapiconstructor). |
| `schema` | The name of the database schema. | Defined in [constructor](#auroradataapiconstructor). |
| `secretArn` | The name or ARN of the secret that enables access to the DB cluster. | Defined in [constructor](#auroradataapiconstructor). |

#### Further reading

- https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#beginTransaction-property
- https://docs.aws.amazon.com/rdsdataservice/latest/APIReference/API_BeginTransaction.html

### `AuroraDataAPI#commitTransaction`

```ts
commitTransaction(
  transactionId: string,
  options?: AuroraDataAPI.CommitTransactionOptions
) => Promise<AuroraDataAPI.CommitTransactionResult>
```

Ends a SQL transaction started with the `beginTransaction` method and commits the changes.

#### Arguments

| Name | Description | Required |
| ---- | ----------- | -------- |
| `transactionId` | The identifier of the transaction to end and commit. | Yes |
| `options` | See options below. | No |

#### Options

| Name | Description | Default |
| ---- | ----------- | ------- |
| `resourceArn` | The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster. | Defined in [constructor](#auroradataapiconstructor). |
| `secretArn` | The name or ARN of the secret that enables access to the DB cluster. | Defined in [constructor](#auroradataapiconstructor). |

#### Further reading

- https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#commitTransaction-property
- https://docs.aws.amazon.com/rdsdataservice/latest/APIReference/API_CommitTransaction.html

### `AuroraDataAPI#rollbackTransaction`

```ts
rollbackTransaction(
  transactionId: string,
  options?: AuroraDataAPI.CommitTransactionOptions
) => Promise<AuroraDataAPI.RollbackTransactionResult>
```

Ends a SQL transaction started with the `beginTransaction` method and rolls-back the changes.

#### Arguments

| Name | Description | Required |
| ---- | ----------- | -------- |
| `transactionId` | The identifier of the transaction to roll back. | Yes |
| `options` | See options below. | No |

#### Options

| Name | Description | Default |
| ---- | ----------- | ------- |
| `resourceArn` | The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster. | Defined in [constructor](#auroradataapiconstructor). |
| `secretArn` | The name or ARN of the secret that enables access to the DB cluster. | Defined in [constructor](#auroradataapiconstructor). |

#### Further reading

- https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#rollbackTransaction-property
- https://docs.aws.amazon.com/rdsdataservice/latest/APIReference/API_RollbackTransaction.html

### `AuroraDataAPI#executeStatement`

```ts
executeStatement(
  options: AuroraDataAPI.ExecuteStatementOptions
) => Promise<RDSDataService.ExecuteStatementResponse>
```

Abstraction of the AWS SDK RDSDataService [`executeStatement`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#executeStatement-property) operation.

From the [SDK Docs](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#executeStatement-property):

> <p>Runs a SQL statement against a database.</p>
> <p>If a call isn't part of a transaction because it doesn't include the <code>transactionId</code> parameter, changes that result from the call are committed automatically.</p>
> <p>The response size limit is 1 MB or 1,000 records. If the call returns more than 1 MB of response data or over 1,000 records, the call is terminated.</p>

#### Arguments

| Name | Description | Required |
| ---- | ----------- | -------- |
| `options` | See options below. | Yes |

#### Options

| Name | Description | Default |
| ---- | ----------- | ------- |
| `sql` (Required) | The SQL statement to run. | `undefined` |
| `includeResultMetadata` | Includes the column metadata. | `undefined` |
| `continueAfterTimeout` | A value that indicates whether to continue running the statement after the call times out. By default, the statement stops running when the call times out.<br /><br />For DDL statements, we recommend continuing to run the statement after the call times out. When a DDL statement terminates before it is finished running, it can result in errors and possibly corrupted data structures. | Defined in [constructor](#auroradataapiconstructor). |
| `database` | The name of the database. | Defined in [constructor](#auroradataapiconstructor). |
| `resourceArn` | The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster. | Defined in [constructor](#auroradataapiconstructor). |
| `resultSetOptions` | Options that control how the result set is returned. | Defined in [constructor](#auroradataapiconstructor). |
| `schema` | The name of the database schema. | Defined in [constructor](#auroradataapiconstructor). |
| `secretArn` | The name or ARN of the secret that enables access to the DB cluster. | Defined in [constructor](#auroradataapiconstructor). |
| `transactionId` | The identifier of a transaction that was started by using the BeginTransaction operation. Specify the transaction ID of the transaction that you want to include the SQL statement in. | `undefined` |

#### Further reading

- https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#executeStatement-property
- https://docs.aws.amazon.com/rdsdataservice/latest/APIReference/API_ExecuteStatement.html

### `AuroraDataAPI#batchExecuteStatement`

```ts
batchExecuteStatement(
  options: AuroraDataAPI.BatchExecuteStatementOptions
) => Promise<RDSDataService.BatchExecuteStatementResponse>
```

Abstraction of the AWS SDK RDSDataService [`batchExecuteStatement`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#batchExecuteStatement-property) operation.

From the [SDK docs](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#batchExecuteStatement-property):
> <p>Runs a batch SQL statement over an array of data.</p>
> <p>You can run bulk update and insert operations for multiple records using a DML statement with different parameter sets. Bulk operations can provide a significant performance improvement over individual insert and update operations.</p>
> <p>If a call isn't part of a transaction because it doesn't include the <code>transactionId</code> parameter, changes that result from the call are committed automatically.</p>

#### Arguments

| Name | Description | Required |
| ---- | ----------- | -------- |
| `options` | See options below. | Yes |

#### Options

| Name | Description | Default |
| ---- | ----------- | ------- |
| `sql` (Required) | The SQL statement to run. | `undefined` |
| `parameterSets` | The parameter set for the batch operation. The maximum number of parameters in a parameter set is 1,000. | `undefined` |
| `database` | The name of the database. | Defined in [constructor](#auroradataapiconstructor). |
| `resourceArn` | The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster. | Defined in [constructor](#auroradataapiconstructor). |
| `schema` | The name of the database schema. | Defined in [constructor](#auroradataapiconstructor). |
| `secretArn` | The name or ARN of the secret that enables access to the DB cluster. | Defined in [constructor](#auroradataapiconstructor). |
| `transactionId` | The identifier of a transaction that was started by using the `beginTransaction` method. Specify the transaction ID of the transaction that you want to include the SQL statement in. | `undefined` |

#### Further reading

- https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#batchExecuteStatement-property
- https://docs.aws.amazon.com/rdsdataservice/latest/APIReference/API_BatchExecuteStatement.html

## `AuroraDataAPI.Transaction` methods

[`AuroraDataAPI#beginTransaction`](#auroradataapibegintransaction) resolves an instance of `AuroraDataAPI.Transaction` that exposes the following methods:

| Name | Description |
| ---- | ----------- |
| [`query`](#auroradataapitransactionquery) | Performs an SQL query in the transaction. |
| [`batchQuery`](#auroradataapitransactionbatchquery) | Performs an SQL query over an array of data in the transaction. |
| [`commit`](#auroradataapitransactioncommit) | Commits and ends the transaction. |
| [`rollback`](#auroradataapitransactionrollback) | Rolls-back and ends the transaction. |
| [`executeStatement`](#auroradataapitransactionexecutestatement) | Abstraction of the [`RDSDataService#executeStatement`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#executeStatement-property) method in context of the transaction. |
| [`batchExecuteStatement`](#auroradataapitransactionbatchexecutestatement) | Abstraction of the RDSDataService [`RDSDataService#batchExecuteStatement`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#batchExecuteStatement-property) method in context of the transaction. |

### `AuroraDataAPI.Transaction#query`

```ts
query<T = AuroraDataAPI.UnknownRow>(
  sql: string,
  params?: AuroraDataAPI.QueryParams,
  options?: AuroraDataAPI.Transaction.TransactionQueryOptions
) => Promise<AuroraDataAPI.QueryResult<T>>
```

Performs an SQL statement in the transaction.

The response size limit is 1 MB or 1,000 records. If the call returns more than 1 MB of response data or over 1,000 records, the call is terminated.

#### Arguments

| Name | Description | Required |
| ---- | ----------- | -------- |
| `sql`  | The SQL statement string to perform. | Yes |
| `params` | See [Query Params](#query-params). | No |
| `options` | See options below. | No |

#### Options

| Name | Description | Default |
| ---- | ----------- | ------- |
| `includeResultMetadata` | A value that indicates whether to include metadata in the results. **Note**: must be `true` for the results to be transformed. | Defined in [`#beginTransaction`](#auroradataapibegintransaction). |
| `continueAfterTimeout` | A value that indicates whether to continue running the statement after the call times out. By default, the statement stops running when the call times out.<br /><br />For DDL statements, we recommend continuing to run the statement after the call times out. When a DDL statement terminates before it is finished running, it can result in errors and possibly corrupted data structures. | Defined in [`#beginTransaction`](#auroradataapibegintransaction). |
| `resultSetOptions` | Options that control how the result set is returned. | Defined in [`#beginTransaction`](#auroradataapibegintransaction). |
| `valueTransformer` | See [Value Transformer](#value-transformer). | Defined in [`#beginTransaction`](#auroradataapibegintransaction) |

#### Further reading

- https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#executeStatement-property
- https://docs.aws.amazon.com/rdsdataservice/latest/APIReference/API_ExecuteStatement.html

### `AuroraDataAPI.Transaction#batchQuery`

```ts
batchQuery(
  sql: string,
  params?: AuroraDataAPI.QueryParams[]
) => Promise<AuroraDataAPI.QueryResult<T>>
```

Performs a batch SQL statement over an array of data in the transaction.

#### Arguments

| Name     | Description                                                  | Required |
| -------- | ------------------------------------------------------------ | -------- |
| `sql`    | The SQL query string to perform.                             | Yes      |
| `params` | An array of [Query Params](#query-params). Maximum of 1,000. | No       |

#### Further reading

- https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#batchExecuteStatement-property
- https://docs.aws.amazon.com/rdsdataservice/latest/APIReference/API_BatchExecuteStatement.html

### `AuroraDataAPI.Transaction#commit`

Commits and ends the transaction.

```ts
commit() => Promise<AuroraDataAPI.CommitTransactionResult>
```

#### Further reading

- https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#commitTransaction-property
- https://docs.aws.amazon.com/rdsdataservice/latest/APIReference/API_CommitTransaction.html

### `AuroraDataAPI.Transaction#rollback`

```ts
rollback() => Promise<AuroraDataAPI.RollbackTransactionResult>
```

Rolls-back and ends the transaction.

#### Further reading

- https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#rollbackTransaction-property
- https://docs.aws.amazon.com/rdsdataservice/latest/APIReference/API_RollbackTransaction.html

### `AuroraDataAPI.Transaction#executeStatement`

```ts
executeStatement(
  options: AuroraDataAPI.Transaction.ExecuteStatementOptions
) => Promise<RDSDataService.ExecuteStatementResponse>
```

Abstraction of the [`RDSDataService#executeStatement`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#executeStatement-property) method in context of the transaction.

#### Arguments

| Name      | Description        | Required |
| --------- | ------------------ | -------- |
| `options` | See options below. | Yes      |

#### Options

| Name                    | Description                                                  | Default                                                      |
| ----------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `sql` (Required)        | The SQL statement to run.                                    | `undefined`                                                  |
| `includeResultMetadata` | A value that indicates whether to include metadata in the results. | Defined in [`#beginTransaction`](#auroradataapibegintransaction). |
| `continueAfterTimeout`  | A value that indicates whether to continue running the statement after the call times out. By default, the statement stops running when the call times out.<br /><br />For DDL statements, we recommend continuing to run the statement after the call times out. When a DDL statement terminates before it is finished running, it can result in errors and possibly corrupted data structures. | Defined in [`#beginTransaction`](#auroradataapibegintransaction). |
| `resultSetOptions`      | Options that control how the result set is returned.         | Defined in [`#beginTransaction`](#auroradataapibegintransaction). |

#### Further reading

- https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#executeStatement-property
- https://docs.aws.amazon.com/rdsdataservice/latest/APIReference/API_ExecuteStatement.html

### `AuroraDataAPI.Transaction#batchExecuteStatement`

```ts
batchExecuteStatement(
  options: AuroraDataAPI.Transaction.BatchExecuteStatementOptions
) => Promise<RDSDataService.BatchExecuteStatementResponse>
```

Abstraction of the RDSDataService [`RDSDataService#batchExecuteStatement`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#batchExecuteStatement-property) method in context of the transaction.

#### Arguments

| Name      | Description        | Required |
| --------- | ------------------ | -------- |
| `options` | See options below. | Yes      |

#### Options

| Name             | Description                                                  | Default     |
| ---------------- | ------------------------------------------------------------ | ----------- |
| `sql` (Required) | The SQL statement to run.                                    | `undefined` |
| `parameterSets`  | The parameter set for the batch operation. The maximum number of parameters in a parameter set is 1,000. | `undefined` |

#### Further reading

- https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#batchExecuteStatement-property
- https://docs.aws.amazon.com/rdsdataservice/latest/APIReference/API_BatchExecuteStatement.html

## Query Params

Query params are, to put simply, just a JS object of *names* and *values*. The *name* is attributed to the placeholder in your SQL statement, for instance:

```ts
query('SELECT * FROM users WHERE id = :id', { id: 99 })
```

The SQL statement with the placeholder `:id` will be interpreted as `SELECT * FROM users WHERE id = 99`.

The Data API for Aurora Serverless however, expects `parameters` to be defined like so:

```ts
[
  {
    name: 'id',
    value: {
      longValue: 99
    }
  }
]
```

`AuroraDataAPI` transforms your query params by inspecting the type of the value. If you need more control, for instance, when inserting JSON, you can define your params using AWS's structure, for example:

```ts
query('UPDATE users SET json_data = :jsonData WHERE id = :id', {
  id: 99,
  jsonData: {
    typehint: 'json',
    value: {
      stringValue: JSON.stringify({ foo: 'bar' })
    }
  }
})
```

Note that `name` is omitted from the object because it is defined by the key.

See [The docs on RDSDataService#executeStatement](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#executeStatement-property) and the [SqlParameter documentation](https://docs.aws.amazon.com/rdsdataservice/latest/APIReference/API_SqlParameter.html) for more information on how to structure your parameter in the "RDSDataService way".

### How values are transformed

| Value Type | Transformed Field |
| ---- | ----- |
| `string` | `{ stringValue: value }` |
| `boolean` | `{ booleanValue: value }` |
| `number` (integer) | `{ longValue: value }` |
| `number` (float) | `{ doubleValue: value }` |
| `string[]` | `{ arrayValue: { stringValues: values } }` |
| `boolean[]` | `{ arrayValue: { booleanValues: values } }` |
| `number[]` (integer) | `{ arrayValue: { longValues: values } }` |
| `number[]` (float) | `{ arrayValue: { doubleValues: values } }` |
| `instanceof Buffer` | `{ blobValue: value }` |
| `instanceof Uint8Array` | `{ blobValue: value }` |

Multidimensional arrays are also transformed recursively:

```ts
// these AuroraDataAPI Query parms...
{
  threeDimensions: [
    [
      ['1.1.1', '1.1.2'],
      ['1.2.1', '1.2.2']
    ],
      ['2.1.1', '2.1.2'],
      ['2.2.1', '2.2.2']
  ]
}

// are transformed into these RDSDataService parameters...
[
  {
    name: 'threeDimensions',
    value: {
      arrayValue: {
        arrayValues: [
          {
            arrayValues: [
              {
                arrayValues: {
                  stringValues: ['1.1.1', '1.1.2']
                }
              },
              {
                arrayValues: {
                  stringValues: ['1.2.1', '1.2.2']
                }
              }
            ],
            arrayValues: [
              {
                arrayValues: {
                  stringValues: ['2.1.1', '2.1.2']
                }
              },
              {
                arrayValues: {
                  stringValues: ['2.2.1', '2.2.2']
                }
              }
            ]
          }
        ]
      }
    }
  }
]

```

### Custom value classes

Support for `CustomValue` classes make it easy to "DRY" your code. They offer a way to encapsulate your values so they can be transformed into an `SqlParameter`. Here is an example of a `uuid` value:

```ts
class UUIDValue implements AuroraDataAPI.CustomValue {
  private value: string

  constructor (value: string) {
    this.value = value
  }

  toSqlParameter (): AuroraDataAPI.SqlParameter {
    return {
      typeHint: 'uuid',
      value: {
        stringValue: this.value
      }
    }
  }
}

await query(
  'SELECT * FROM users WHERE uuid = :uuid',
  { uuid: new UUIDValue(req.params.uuid) }
)

// it works with arrays too:
await query(
  'SELECT * FROM users WHERE uuid = ANY(:uuids)',
  { uuids: req.params.uuids.map((uuid) => new UUIDValue(uuid)) }
)

```

A few predefined custom values are available: `AuroraDataAPI.JSONValue` and `AuroraDataAPI.BlobValue`, for more information please take a look at [`src/customValues.ts`](src/customValues.ts).

## Value Transformer

When `includeResultMetadata` is `true`, the Data API response payload includes metadata for each of the columns in the result set. In cases such as `timezone`, `json` or `jsonb` columns, the column value will be returned as a `stringValue` (or `stringValues` in the case of an array).

By default `AuroraDataAPI` some types (such as those described above) into the expected objects. e.g. a `timezone` column will be parsed with `new Date`, a `jsonb` column will parsed using `JSON.parse`.

You can override and/or extend the default behavior by providing your own `valueTransformer` like so:

```ts
const valueTransformer = (
  value: any,
  metadata: RDSDataService.ColumnMetadata,
  next: Function
) => {
  if (
    metadata.typeName === 'varchar' &&
    typeof value === 'string'
  ) {
    return value.toUpperCase()
  }
  return next() // remove this line to disable the default value transformer
}

// construct AuroraDataAPI with your new value transformer
const client = new AuroraDataAPI({
  ...config,
  valueTransformer
})

// or add it to the options argument on #query or transaction#query
const result = await client.query(
  'SELECT email FROM users',
  undefined,
  { valueTransformer }
) // => { rows: [{ email: 'EXAMPLE@EXAMPLE.COM' }] }
```

## Example

Take a look at the [example folder](../../example) for a complete example app that uses all the **Data API for Aurora Serverless Suite** packages.

## MIT License

Copyright (c) 2020 Marc Greenstock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.