# Data API Local Serverless Plugin

Data API Local Serverless Plugin is a [Aurora Serverless Data API](https://aws.amazon.com/blogs/aws/new-data-api-for-amazon-aurora-serverless/) emulator, its main purpose is to simplify the development of applications using the Data API by making it available offline and local, similar to [dynamodb-local](https://github.com/rynop/dynamodb-local) but for PostgreSQL (MySQL coming soon).

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
