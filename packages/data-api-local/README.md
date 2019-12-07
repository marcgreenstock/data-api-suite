# Data API Local

AWS Aurora Serverless Data API emulator for local development.

## CLI

dataApiLocal mysql --host localhost --port 3336 --user marc --password foobar

## Programatic usage

### PostgreSQL

```ts
import { dataApiLocal } from './data-api-local'

DataAPILocal.dataApiLocal({
  engine: 'postgres',
  logger: console,
  connection: {
    host: 'localhost',
    port: 3336,
    user: 'marc',
    password: 'foobar'
  },
  host: {
    port: 8080,
    hostname: 'localhost'
  }
})
```

### MySQL

```ts
import { dataApiLocal } from './data-api-local'

DataAPILocal.dataApiLocal({
  engine: 'mysql',
  logger: console,
  connection: {
    host: 'localhost',
    port: 3336,
    user: 'marc',
    password: 'foobar'
  },
  host: {
    port: 8080,
    hostname: 'localhost'
  }
})
```
