# Data API Local

![](https://github.com/marcgreenstock/data-api-local/workflows/master/badge.svg)

Data API Local is a [Aurora Serverless Data API](https://aws.amazon.com/blogs/aws/new-data-api-for-amazon-aurora-serverless/) emulator, its main purpose is to simplify the development of applications using the Data API by making it available offline and local, similar to [dynamodb-local](https://github.com/rynop/dynamodb-local) but for MySQL and PostgreSQL.

## BYO Database

With Data API Local, you bring your own database, it works with MySQL and PostgreSQL.

This library does not have any constraints on the supported versions of MySQL and PostgreSQL in Aurora Serverless, therefore, one should take care to locally install only database versions that are supported by Aurora Serverless.

# Packages

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

This repository is a mono-repo consisting of 3 packages, documentation for each is contained in their respective package folder.

## [data-api-local](packages/data-api-local)

The **data-api-local** is a node.js emulator for the AWS RDS Aurora Serverless Data API. Use this libary if you need to programatically start an emulator in your node.js application, otherwise consider using [data-api-local-serverless](packages/data-api-local-serverless) or [data-api-local-cli](packages/data-api-local-cli).

## [data-api-local-serverless](packages/data-api-local-serverless)

The **data-api-local-serverless** is a [serverless](https://serverless.com/) plugin that plays nice with [serverless-ofline](https://github.com/dherault/serverless-offline).


### Example usage:

```yml
# serverless.yml

service: myApp

provider:
  name: aws
  runtime: nodejs10.x
  region: us-east-1
  environment:
    AWS_REGION: ${self:provider.region}
    DATA_API_SECRET_ARN: arn:aws:secretsmanager:us-east-1:123456789012:secret:myApp
    DATA_API_RESOURCE_ARN: arn:aws:rds:us-east-1:123456789012:cluster:myApp
    DATABASE_NAME: myApp
  iamRoleStatements:
    - Effect: Allow
      Action:
        - secretsmanager:GetSecretValue
      Resource:
        - ${self:provider.environment.DATA_API_SECRET_ARN}
    - Effect: Allow
      Action:
        - rds-data:*
      Resource:
        - ${self:provider.environment.DATA_API_RESOURCE_ARN}

plugins:
  - data-api-local-serverless
  - serverless-offline # ensure this is added after data-api-local-serverless

custom:
  data-api-local:
    port: 8080
    hostname: localhost
    database: postgresql://user:secret@localhost:5432

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
import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult
} from 'aws-lambda'

export const example = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Create a RDSDataService client see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html
  // The `endpoint` property is used here to set to the local server if `event.isOffline` is truthy.
  const client = new RDSDataService({
    endpoint: event.isOffline ? 'http://localhost:8080' : undefined,
    region: process.env.AWS_REGION
  })

  // Execute your SQL
  const result = await client.executeStatement({
    sql: 'SELECT * FROM "myTable";',
    database: process.env.DATABASE_NAME,
    secretArn: process.env.DATA_API_SECRET_ARN,
    resourceArn: process.env.DATA_API_RESOURCE_ARN
  }).promise()

  // Return the result
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  }
}
```

For more information and examples, see the [data-api-local-serverless README](packages/data-api-local-serverless).

## [data-api-local-cli](packages/data-api-local-cli)

The **data-api-local-cli** is a convenient command line interface.

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
