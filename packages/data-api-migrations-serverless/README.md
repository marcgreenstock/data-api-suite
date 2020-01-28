# Data API Migrations Serverless Plugin

## Summary

A Serverless plugin to **generate**, **apply** and **rollback** migrations on the Data API for Aurora Serverless. Plays nice with [data-api-local-serverless](packages/data-api-local-serverless) and [aurora-data-api](../aurora-data-api).

## [Data API for Aurora Serverless Suite](https://github.com/marcgreenstock/data-api-local)

This library is part of the **[Data API for Aurora Serverless Suite](https://github.com/marcgreenstock/data-api-local)**, a [monorepo](https://en.wikipedia.org/wiki/Monorepo) that includes libraries, [Serverless Framework](https://serverless.com/) plugins and development tools to simplify and enhance the development, deployment and use of the [Data API for Aurora Serverless](https://aws.amazon.com/blogs/aws/new-data-api-for-amazon-aurora-serverless/) on Amazon Web Services.

## Installation

```sh
$ npm install data-api-migrations-serverless --save-dev
```

## Config

Simply add the `data-api-local` config to your `serverless.yml` file. e.g.

```yml
service: myApp

provider:
  name: aws
  runtime: nodejs10.x
  region: us-east-1
  environment:
    AWS_REGION: ${self:provider.region}
    DATA_API_SECRET_ARN: arn:aws:secretsmanager:us-east-1:123456789012:secret:example
    DATA_API_RESOURCE_ARN: arn:aws:rds:us-east-1:123456789012:cluster:example
    DATABASE_NAME: example
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
	- serverless-plugin-typescript # Also works with vanila old JavaScript
  - data-api-migrations-serverless
  - data-api-local-serverless # Recommended for offline development
  - serverless-offline

custom:
  data-api-migrations:
    local: # config for local/offline development (default stage when stage is not provided)
      region: ${self:provider.region}
      endpoint: http://localhost:8080
      maxRetries: 0
      secretArn: ${self:provider.environment.DATA_API_SECRET_ARN}
      resourceArn: ${self:provider.environment.DATA_API_RESOURCE_ARN}
      database: ${self:provider.environment.DATA_API_DATABASE_NAME}
      credentials:
        accessKeyId: example
        secretAccessKey: example
    prod: # config for production
      region: ${self:provider.region}
      secretArn: ${self:provider.environment.DATA_API_SECRET_ARN}
      resourceArn: ${self:provider.environment.DATA_API_RESOURCE_ARN}
      database: ${self:provider.environment.DATA_API_DATABASE_NAME}
```

## `custom.data-api-migrations` Config

| Name            | Description                                                  | Default |
| --------------- | ------------------------------------------------------------ | ------- |
| `typescript`    | Enable/disable typescript migration files.                   | `true`  |
| `[stage].(...)` | [See AuroraDataAPI#Constructor](../aurora-data-api/README.md#AuroraDataAPI#constructor). |         |

## Commands

| Command | Description |
| ------- | ----------- |
| `sls migraitons create` | Generate a new migration file.<br />**Arguments:**<br />`--name` or `-n` : The name for the migration (Required). |
| `sls migrations apply` | Apply all pending migrations.<br />**Arguments:**<br />`--stage`: The stage (defaults to `local` if not provided). |
| `sls migrations rollback` | Rollback the most recent (applied) migration.<br />**Arguments:**<br />`--stage`: The stage (defaults to `local` if not provided). |
| `sls migrations status` | List the migrations that have been applied.<br />**Arguments:**<br />`--stage`: The stage (defaults to `local` if not provided). |

## Migration files

Migrations files are created in the `[PROJECT_ROOT]/migrations` folder and each file exports two functions: `up` to apply migrations and `down` to rollback migrations.

```ts
// migrations/20200103112043_createUsers.ts

import { MigrationFn } from 'data-api-migrations'

export const up: MigrationFn = async (dataAPI) => {
  const t = await dataAPI.beginTransaction()
  try {
    await t.query(`
      CREATE TABLE "users" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar,
        "completedAt" timestamp,
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now()
      )
    `)
    await t.commit()
  } catch (error) {
    await t.rollback()
    throw error
  }
}

export const down: MigrationFn = async (dataAPI) => {
  const t = await dataAPI.beginTransaction()
  try {
    await t.query('DROP TABLE "users"')
    await t.commit()
  } catch (error) {
    await t.rollback()
    throw error
  }
}
```

The first argument `dataAPI` is an instance of the [aurora-data-api](../aurora-data-api) library.

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