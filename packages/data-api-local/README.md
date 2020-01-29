# Data API Local

[![Master](https://github.com/marcgreenstock/data-api-suite/workflows/master/badge.svg)](https://github.com/marcgreenstock/data-api-suite/actions) [![NPM](https://img.shields.io/npm/v/data-api-local.svg)](https://www.npmjs.com/package/data-api-local)

## Summary

**Data API Local Plugin** is a [Data API for Aurora Serverless](https://aws.amazon.com/blogs/aws/new-data-api-for-amazon-aurora-serverless/) emulator. Its purpose is to simplify the development of applications using the Data API by making it available offline and local, similar to [serverless-dynamodb-local](https://github.com/99xt/serverless-dynamodb-local) but for PostgreSQL (MySQL coming soon).

## [Data API for Aurora Serverless Suite](https://github.com/marcgreenstock/data-api-suite#readme)

This library is part of the **[Data API for Aurora Serverless Suite](https://github.com/marcgreenstock/data-api-suite#readme)**, a [monorepo](https://en.wikipedia.org/wiki/Monorepo) that includes libraries, [Serverless Framework](https://serverless.com/) plugins and development tools to simplify and enhance the development, deployment and use of the [Data API for Aurora Serverless](https://aws.amazon.com/blogs/aws/new-data-api-for-amazon-aurora-serverless/) on Amazon Web Services.

## Usage

```ts
import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { dataApiLocal } from 'data-api-local'

// assuming your in an async function
await dataApiLocal({
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

const client = new RDSDataService({
  endpoint: 'http://localhost:8080',
  region: 'us-east-1',
  // If you have an AWS profile or running this in a role, this isn't required
  credentials: {
    accessKeyId: 'SECRET_ID',
    secretAccessKey: 'SECRET_KEY'
  }
})

const result = await client.executeStatement({
  sql: 'SELECT * FROM "users" WHERE id = :id',
  parameters: [{
    name: 'id',
    value: {
      longValue: 42
    }
  }],
  database: 'example'
  // secretArn and resourceArn are not used but are required for the AWS SDK
  secretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:dummy',
  resourceArn: 'arn:aws:rds:us-east-1:123456789012:cluster:dummy'
}).promise()
```

## Example

Take a look at the [example folder](https://github.com/marcgreenstock/data-api-suite/tree/master/example) for a complete example app that uses all the **Data API for Aurora Serverless Suite** packages.

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
