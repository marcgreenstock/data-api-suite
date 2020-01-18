# AuroraDataAPI

[![Master](https://github.com/marcgreenstock/data-api-local/workflows/master/badge.svg)](https://github.com/marcgreenstock/data-api-local/actions)

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
      name: 'Bender Bending Rrodregius'
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
        stringValue: 'Bender Bending Rrodregius'
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
new AuroraDataAPI(config: AuroraDataAPIConfig) => AuroraDataAPI
```

Constructs a new instance of `AuroraDataAPI`.

#### Config

| Name | Description | Required |
| ---- | ----------- | -------- |
| `resourceArn`| "The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster." [^executeStatement] | Yes |
| `secretArn` | "The name or ARN of the secret that enables access to the DB cluster." [^executeStatement] | Yes |
| `database` | "The name of the database." [^executeStatement] | No |
| `schema` | "The name of the database schema." [^executeStatement] | No |
| `continueAfterTimeout` | "A value that indicates whether to continue running the statement after the call times out. By default, the statement stops running when the call times out.<br /><br />For DDL statements, we recommend continuing to run the statement after the call times out. When a DDL statement terminates before it is finished running, it can result in errors and possibly corrupted data structures." [^executeStatement] | No |
| `resultSetOptions` | "Options that control how the result set is returned." [^executeStatement] | No |
| `valueTransformer` | See [Value Transformer](#Value-Transformer). | No |
| `...rest` | Unspecified properties (i.e. properties from `RDSDataService.ClientConfiguration`) will be used to construct the `RDSDataService` client. [See the AWS SDK docs for more info.](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#constructor-property) | Conditional - see note below. |

**Note**: The `RDSDataService` can be constructed without any properties, for instance when the [Global Configuration Object](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/global-config-object.html) is set.

#### Class Properties

| Name | Description | 
| ---- | ----------- |
| `client` | Instance of the [`RDSDataService`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html). |
| `requestConfig` | Object containing properties to send to the [`RDSDataService`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html) methods. |

## AuroraDataAPI Methods

| Name | Description |
| ---- | ----------- |
| [`query`](#AuroraDataAPI#query) | Performs an SQL query. |
| [`batchQuery`](#AuroraDataAPI#batchQuery) | Runs a batch SQL statement over an array of data. |
| [`beginTransaction`](#AuroraDataAPI#beginTransaction) | Starts a SQL transaction. |
| [`commitTransaction`](#AuroraDataAPI#commitTransaction) | Commits and ends a SQL transaction. |
| [`rollbackTransaction`](#AuroraDataAPI#rollbackTransaction) | Rolls-back and ends a SQL transaction. |
| [`executeStatement`](#AuroraDataAPI#executeStatement) | Abstraction of the [`RDSDataService#executeStatement`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#executeStatement-property) method. |
| [`batchExecuteStatement`](#AuroraDataAPI#batchExecuteStatement) | Abstraction of the RDSDataService [`RDSDataService#batchExecuteStatement`](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#batchExecuteStatement-property) method. | 

### `AuroraDataAPI#query`

```ts
query(sql: string, params?: QueryParams, options: QueryOptions) => Promise<QueryResult>
```

As mentioned above, `AuroraDataAPI` simplifies the request and response payloads. The query method accepts 3 arguments (2 optional); `sql`, `params` and `options`.

The `options` argument can be used to override any of the `RDSDataService.ExecuteStatementRequest` properties defined in the `AuroraDataAPI` constructor. In addition, the `options` argument also accepts `transactionId` and `includeResultMetadata` and `typeTransformers`.

The `includeResultMetadata` property is `true` by default, and if true will transform the result set in the resolved payload.

#### Arguments

| Name | Description | Required |
| ---- | ----------- | -------- |
| `sql`  | The SQL query string to perform. | Yes |
| `params` | See [Query Params](#Query-Params). | No |
| `options` | See options below. | No |

#### Options 

| Name | Description | Default |
| ---- | ----------- | ------- |
| `includeResultMetadata` | Includes the column metadata also transforms the results. | `true` |
| `continueAfterTimeout` | "A value that indicates whether to continue running the statement after the call times out. By default, the statement stops running when the call times out.<br /><br />For DDL statements, we recommend continuing to run the statement after the call times out. When a DDL statement terminates before it is finished running, it can result in errors and possibly corrupted data structures." [^executeStatement] | Defined in constructor. |
| `database` | "The name of the database." [^executeStatement] | Defined in constructor. |
| `resourceArn` | "The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster." [^executeStatement] | Defined in constructor. |
| `resultSetOptions` | "Options that control how the result set is returned." [^executeStatement] | Defined in constructor. |
| `schema` | "The name of the database schema." [^executeStatement] | Defined in constructor. |
| `secretArn` | "The name or ARN of the secret that enables access to the DB cluster." [^executeStatement] | Defined in constructor. |
| `transactionId` | "The identifier of a transaction that was started by using the BeginTransaction operation. Specify the transaction ID of the transaction that you want to include the SQL statement in." [^executeStatement] | `undefined` |
| `valueTransformer` | See [Value Transformer](#Value-Transformer). | Defined in constructor. |

[^executeStatement]: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#executeStatement-property

### `AuroraDataAPI#batchQuery`

```ts
batchQuery(sql: string, params?: QueryParams[], options?: BatchQueryOptions) => Promise<BatchQueryResult>
```

Runs a batch SQL statement over an array of data.

#### Arguments

| Name | Description | Required |
| ---- | ----------- | -------- |
| `sql`  | The SQL query string to perform. [^batchExecuteStatement] | Yes |
| `params` | An array of [Query Params](#Query-Params). Maximum of 1,000. | No |
| `options` | See options below. | No |

#### Options

| Name | Description | Default |
| ---- | ----------- | ------- |
| `database` | "The name of the database." [^batchExecuteStatement] | Defined in constructor. |
| `resourceArn` | "The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster." [^batchExecuteStatement] | Defined in constructor. |
| `schema` | "The name of the database schema." [^batchExecuteStatement] | Defined in constructor. |
| `secretArn` | "The name or ARN of the secret that enables access to the DB cluster." [^batchExecuteStatement] | Defined in constructor. |
| `transactionId` | "The identifier of a transaction that was started by using the BeginTransaction operation. Specify the transaction ID of the transaction that you want to include the SQL statement in." [^batchExecuteStatement] | `undefined` |

### `AuroraDataAPI#beginTransaction`

```ts
beginTransaction(options?: BeginTransactionOptions) => Promise<AuroraDataAPITransaction>
```

Starts a SQL transaction and resolves an instance of [`AuroraDataAPITransaction`](#AuroraDataAPITransaction).

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
| `database` | "The name of the database." [^beginTransaction] | Defined in constructor. |
| `resourceArn` | "The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster." [^beginTransaction] | Defined in constructor. |
| `schema` | "The name of the database schema." [^beginTransaction] | Defined in constructor. |
| `secretArn` | "The name or ARN of the secret that enables access to the DB cluster." [^beginTransaction] | Defined in constructor. |

[^beginTransaction]: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#beginTransaction-property

### `AuroraDataAPI#commitTransaction`

```ts
commitTransaction(transactionId: string, options?: CommitTransactionOptions) => Promise<CommitTransactionResult>
```

Ends a SQL transaction started with the `beginTransaction` method and commits the changes.

#### Arguments

| Name | Description | Required |
| ---- | ----------- | -------- |
| `transactionId` | "The identifier of the transaction to end and commit." [^commitTransaction] | Yes |
| `options` | See options below. | No |

#### Options

| Name | Description | Default |
| ---- | ----------- | ------- |
| `resourceArn` | "The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster." [^commitTransaction] | Defined in constructor. |
| `secretArn` | "The name or ARN of the secret that enables access to the DB cluster." [^commitTransaction] | Defined in constructor. |

[^commitTransaction]: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#commitTransaction-property

### `AuroraDataAPI#rolllbackTransaction`

```ts
rollbackTransaction(transactionId: string, options?: CommitTransactionOptions) => Promise<RollbackTransactionResult>
```

Ends a SQL transaction started with the `beginTransaction` method and rolls-back the changes.

#### Arguments

| Name | Description | Required |
| ---- | ----------- | -------- |
| `transactionId` | "The identifier of the transaction to roll back." [^rollbackTransaction] | Yes |
| `options` | See options below. | No |

#### Options

| Name | Description | Default |
| ---- | ----------- | ------- |
| `resourceArn` | "The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster." [^rollbackTransaction] | Defined in constructor. |
| `secretArn` | "The name or ARN of the secret that enables access to the DB cluster." [^rollbackTransaction] | Defined in constructor. |

[^rollbackTransaction]: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#rollbackTransaction-property

### `AuroraDataAPI#executeStatement`

```ts
executeStatement(options: ExecuteStatementOptions) => Promise<RDSDataService.ExecuteStatementResponse>
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

| Name | Description | Default |
| ---- | ----------- | ------- |
| `sql` (Required) | "The SQL statement to run." [^executeStatement] | `undefined` |
| `includeResultMetadata` | Includes the column metadata also transforms the results. | `undefined` |
| `continueAfterTimeout` | "A value that indicates whether to continue running the statement after the call times out. By default, the statement stops running when the call times out." [^executeStatement]  | Defined in constructor. |
| `database` | "The name of the database." [^executeStatement] | Defined in constructor. |
| `resourceArn` | "The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster." [^executeStatement] | Defined in constructor. |
| `resultSetOptions` | "Options that control how the result set is returned." [^executeStatement] | Defined in constructor. |
| `schema` | "The name of the database schema." [^executeStatement] | Defined in constructor. |
| `secretArn` | "The name or ARN of the secret that enables access to the DB cluster." [^executeStatement] | Defined in constructor. |
| `transactionId` | "The identifier of a transaction that was started by using the BeginTransaction operation. Specify the transaction ID of the transaction that you want to include the SQL statement in." [^executeStatement] | `undefined` |

### `AuroraDataAPI#batchExecuteStatement`

```ts
batchExecuteStatement(options: BatchExecuteStatementOptions) => Promise<RDSDataService.BatchExecuteStatementResponse>
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
| `sql` (Required) | "The SQL statement to run." [^batchExecuteStatement] | `undefined` |
| `parameterSets` | "The parameter set for the batch operation. The maximum number of parameters in a parameter set is 1,000." [^batchExecuteStatement] | `undefined` |
| `database` | "The name of the database." [^batchExecuteStatement] | Defined in constructor. |
| `resourceArn` | "The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster." [^batchExecuteStatement] | Defined in constructor. |
| `schema` | "The name of the database schema." [^batchExecuteStatement] | Defined in constructor. |
| `secretArn` | "The name or ARN of the secret that enables access to the DB cluster." [^batchExecuteStatement] | Defined in constructor. |
| `transactionId` | "The identifier of a transaction that was started by using the `beginTransaction` method. Specify the transaction ID of the transaction that you want to include the SQL statement in." [^batchExecuteStatement] | `undefined` |

[^batchExecuteStatement]: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#batchExecuteStatement-property

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

Note that `name` is ommited from the object because it is defined by the key. 

See [The docs on RDSDataService#executeStatement](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html#executeStatement-property) for more information on how to structure your parameter in the "RDSDataService way".

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

## Value Transformer

When `includeResultMetadata` is `true`, the Data API response payload includes metadata for each of the columns in the result set. In cases such as `timezone`, `json` or `jsonb` columns, the column value will be returned as a `stringValue` (or `stringValues` in the case of an array).

By default `AuroraDataAPI` some types (such as those described above) into the expected objects. e.g. a `timezone` column will be parsed with `new Date`, a `jsonb` column will parsed using `JSON.parse`.

You can override and/or extend the default behaviour by providing your own `valueTransformer` like so:

```ts
const valueTransformer = (
  value: unknown, 
  metadata: AuroraDataAPI.Metadata, 
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
const result = await client.query('SELECT email FROM users', undefined, { valueTransformer }) // => { rows: [{ email: 'EXAMPLE@EXAMPLE.COM' }] }
```

## AuroraDataAPITransaction Methods

[`AuroraDataAPI#beginTransaction`](AuroraDataAPI#beginTransaction) resolves an instance of `AuroraDataAPITransaction` that exposes

| Name | Description |
| ---- | ----------- |
| `query` | Runs an SQL query in the transaction. |
| `batchQuery` | Runs and SQL query over an array of data in the transaction. |
| `commit` | |
| `rollback` | |
| `executeStatement` | |
| `batchExecuteStatement` | |

### `AuroraDataAPITransaction#query`

```ts
query<T = AuroraDataAPI.UnknownRow>(sql: string, params?: QueryParams, options: AuroraDataAPITransaction.TransactionQueryOptions) => Promise<AuroraDataAPI.QueryResult<T>>
```

#### Arguments

| Name | Description | Required |
| ---- | ----------- | -------- |
| `sql`  | The SQL query string to perform. | Yes |
| `params` | See [Query Params](#Query-Params). | No |
| `options` | See options below. | No |

#### Options 

| Name | Description | Default |
| ---- | ----------- | ------- |
| `includeResultMetadata` | Includes the column metadata also transforms the results. | `true` |
| `continueAfterTimeout` | A value that indicates whether to continue running the statement after the call times out. By default, the statement stops running when the call times out. | Defined in [`#beginTransaction`](#AuroraDataAPI#beginTransaction). |
| `resultSetOptions` | Options that control how the result set is returned. | Defined in [`#beginTransaction`](#AuroraDataAPI#beginTransaction). |
| `valueTransformer` | See [Value Transformer](#Value-Transformer). | Defined in [`#beginTransaction`](#AuroraDataAPI#beginTransaction) |

## Example

Take a look at the example folder.

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