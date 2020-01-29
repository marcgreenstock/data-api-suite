# Data API Local Serverless Plugin

[![Master](https://github.com/marcgreenstock/data-api-local/workflows/master/badge.svg)](https://github.com/marcgreenstock/data-api-local/actions) [![NPM](https://img.shields.io/npm/v/data-api-local-serverless.svg)](https://www.npmjs.com/package/data-api-local-serverless)

## Summary

**Data API Local Serverless Plugin** is a plugin for the [Serverless Framework](https://serverless.com/) that starts a [Data API for Aurora Serverless](https://aws.amazon.com/blogs/aws/new-data-api-for-amazon-aurora-serverless/) emulator. Its purpose is to simplify the development of serverless applications using the Data API by making it available offline and local, similar to [serverless-dynamodb-local](https://github.com/99xt/serverless-dynamodb-local) but for PostgreSQL (MySQL coming soon).

## [Data API for Aurora Serverless Suite](https://github.com/marcgreenstock/data-api-local#readme)

This library is part of the **[Data API for Aurora Serverless Suite](https://github.com/marcgreenstock/data-api-local#readme)**, a [monorepo](https://en.wikipedia.org/wiki/Monorepo) that includes libraries, [Serverless Framework](https://serverless.com/) plugins and development tools to simplify and enhance the development, deployment and use of the [Data API for Aurora Serverless](https://aws.amazon.com/blogs/aws/new-data-api-for-amazon-aurora-serverless/) on Amazon Web Services.

## Installation

```sh
$ npm install data-api-local-serverless serverless-offline --save-dev
```

## Config

Simply add the `data-api-local` config to your `serverless.yml` file, e.g:

```yml
# serverless.yml
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
  - data-api-local-serverless
  - serverless-offline # ensure this is added after data-api-local-serverless

custom:
  data-api-local:
    server:
      port: 8080 # default
      hostname: localhost # default
    database:
      engine: postgresql
      connectionString: postgresql://user:secret@localhost:5432
```

## `custom.data-api-local` Config

| Name | Description | Default |
| ---- | ---- | ---- |
| `server.port` | Port number the data API emulator will listen on. | `8080` |
| `server.hostname` | Hostname to start run the data API will listen on. | `localhost` |
| `database.engine` | Database engine (currently only `postgresql`). | `postgresql` |
| `database.(...)` | Database connection settings. See [node-postgres docs](https://node-postgres.com/api/client#constructor). |  |

## Usage

```sh
$ sls offline start
# or
$ serverless offline start
```

## Example

Take a look at the [example folder](https://github.com/marcgreenstock/data-api-local/tree/master/example) for a complete example app that uses all the **Data API for Aurora Serverless Suite** packages.

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