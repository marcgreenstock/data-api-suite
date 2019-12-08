# Serverless Data API Local

## Installation

Install serverless-local and serverless-data-api-local

```sh
npm i --save-dev serverless-local serverless-data-api-local
```

Add it to your serverless.yml:

```yml
service: serverless-data-api-local-plugin-postgres-example

provider:
  name: aws
  runtime: nodejs10.x

plugins:
  - serverless-data-api-local-plugin
  - serverless-offline # ensure this is added last

custom:
  DataAPILocal:
    port: 8080
    engine: pg
    dbUrl: postgresql://user:secret@localhost:5432/example

functions:
  hello:
    handler: handler.hello
    events:
      - http:
          path: '/'
          method: get
```

## Usage

```ts
import RDSDataService from 'aws-sdk/clients/RDSDataService'

export const hello = async (event, context) => {
  const client = new RDSDataService({
    region: 'us-east-1',
    endpoint: event.offline ? 'http://localhost:8080' : undefined
  })
  const result = await client.executeStatement({
    resourceArn: process.env.DATA_API_RESOURCE_ARN,
    secretArn: process.env.DATA_API_SECRET_ARN,
    sql: 'SELECT * FROM users where users.id = :id;',
    includeResultMetadata: true,
    parameters: [
      name: 'id,
      typeHint: 'DECIMAL',
      value: {
        longValue: 42
      }
    ]
  })
  return {
    statusCode: 200,
    body: JSON.stringify({
      result
    })
  }
}
