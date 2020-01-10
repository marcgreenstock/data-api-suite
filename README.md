# Data API Local

[![Master](https://github.com/marcgreenstock/data-api-local/workflows/master/badge.svg)](https://github.com/marcgreenstock/data-api-local/actions)

Data API Local is a [Aurora Serverless Data API](https://aws.amazon.com/blogs/aws/new-data-api-for-amazon-aurora-serverless/) emulator, its main purpose is to simplify the development of applications using the Data API by making it available offline and local, similar to [dynamodb-local](https://github.com/rynop/dynamodb-local) but for PostgreSQL (MySQL coming soon).

## BYO Database

With Data API Local, you bring your own database. This library does not have any constraints on the supported versions of PostgreSQL in Aurora Serverless, therefore, one should take care to locally install only database versions that are supported by Aurora Serverless.

# Packages

This repository is a mono-repo consisting of 4 packages, documentation for each is contained in their respective package folder.

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

## Serverless plugins

The following libraries are designed to work with the [Serverless](https://serverless.com/) framework.

| Name | Description |
| ---- | ----------- |
| [`data-api-local-serverless`](packages/data-api-local-serverless) | [![NPM](https://img.shields.io/npm/v/data-api-local-serverless.svg)](https://www.npmjs.com/package/data-api-local-serverless)<br />Serverless plugin to start a local Aurora Serverless Data API server for offline development that plays nice with [serverless-ofline](https://github.com/dherault/serverless-offline). | 
| [`data-api-migrations-serverless`](packages/data-api-migrations-serverless) | [![NPM](https://img.shields.io/npm/v/data-api-migrations-serverless.svg)](https://www.npmjs.com/package/data-api-migrations-serverless)<br />Serverless plugin to generate, apply and rollback migrations on the AWS RDS Aurora Serverless Data API. Plays nice with data-api-local-serverless. |

## Node.js libaries

The following libraries are designed to be used in a node.js environment.

| Package Name | Description |
| ---- | ----------- |
| [`data-api-local`](packages/data-api-local)| [![NPM](https://img.shields.io/npm/v/data-api-local.svg)](https://www.npmjs.com/package/data-api-local)<br />This is the foundation library for data-api-local-serverless. Use this libary if you're not using Serverless and need to programatically start an emulator in your node.js application. |
| [`data-api-migrations`](packages/data-api-migrations) | [![NPM](https://img.shields.io/npm/v/data-api-migrations.svg)](https://www.npmjs.com/package/data-api-migrations)<br />This is the foundation library for data-api-migrations-serverless. Use this library if you're not using Serverless. |

# Example usage of data-api-local-serverless and data-api-migrations together

```yml
# serverless.yml
service: myApp

provider:
  name: aws
  runtime: nodejs10.x
  region: us-east-1
  environment:
    AWS_REGION: ${self:provider.region}
    DATA_API_SECRET_ARN: arn:aws:secretsmanager:us-east-1:123456789012:secret:my-app
    DATA_API_RESOURCE_ARN: arn:aws:rds:us-east-1:123456789012:cluster:my-app
    DATABASE_NAME: my-app
  iamRoleStatements:
    - Effect: Allow
      Action:
        - "secretsmanager:GetSecretValue"
      Resource:
        - ${self:provider.environment.DATA_API_SECRET_ARN}
    - Effect: Allow
      Action:
        - "rds-data:*"
      Resource:
        - ${self:provider.environment.DATA_API_RESOURCE_ARN}

plugins:
  - serverless-typescript
  - data-api-local-serverless
  - data-api-local-migrations
  - serverless-offline # ensure this is added after data-api-local-serverless

custom:
  data-api-local:
    server:
      port: 8080 # default
      hostname: localhost # default
    database:
      engine: postgresql
      connectionString: postgresql://user:secret@localhost:5432
  data-api-migrations:
    destFolder: ./migrations
    typescript: true
    clientConfig:
      region: ${self:provider.region}
    methodConfig:
      secretArn: ${self:provider.environment.DATA_API_SECRET_ARN}
      resourceArn: ${self:provider.environment.DATA_API_RESOURCE_ARN}
      database: ${self:provider.environment.DATABASE_NAME}

functions:
  example:
    handler: handler.example
    events:
      - http:
          path: '/'
          method: get
```

```ts
// handler.ts
import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

export const example = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Create a RDSDataService client see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html
  // The `endpoint` property is used here to set to the local server if `event.isOffline` is truthy.
  const client = new RDSDataService({
    endpoint: event.isOffline ? 'http://localhost:8080' : undefined,
    region: process.env.AWS_REGION
  })

  // Execute your SQL
  const result = await client.executeStatement({
    sql: 'SELECT * FROM "myTable" WHERE "id" = :id;',
    database: process.env.DATABASE_NAME,
    secretArn: process.env.DATA_API_SECRET_ARN,
    resourceArn: process.env.DATA_API_RESOURCE_ARN,
    parameters: [{
      name: 'id',
      value: {
        longValue: 42
      }
    }]
  }).promise()

  // Return the result
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  }
}
```

**Important:** [data-api-local-serverless](packages/data-api-local-serverless) convieniently binds to the `offline` lifecycle hooks builtin to [serverless-ofline](https://github.com/dherault/serverless-offline). To start  your data-api server and serverless-offline run:

```sh
$ sls offline
# or
$ serverless offline
```

For more information and examples, see the [data-api-local-serverless README](packages/data-api-local-serverless).

# Contributing

## Installing

```sh
$ git clone git@github.com:marcgreenstock/data-api-local.git
$ cd data-api-local
$ npm install
$ npm run bootstrap # this runs lerna bootstrap to run npm install on each package and npm link the packages together.
```

## Testing

We're using [docker-compose.yml](docker-compose.yml) to create a local MySQL and PostgreSQL database with seed data from the files in the [initdb](initdb) directory.

```sh
$ docker-compose up --build -d # start the test databases
$ docker ps -a # check the processes are running
$ npm test
```
