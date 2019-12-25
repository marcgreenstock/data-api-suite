# Data API Local

AWS Aurora Serverless Data API emulator for local development.

**Note:** Currently only supports PostgreSQL - MySQL is on the roadmap.

## Example:

```ts
import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { dataApiLocal } from './data-api-local'

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
