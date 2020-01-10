# DataAPI Migrations

```ts
// migrations/20200103112043_createUsers.ts

import { UpMigration, DownMigration } from 'data-api-local-migrations'

const parameterSets = ['foo@example.com', 'bar@example.com'].map((email) => [{
  name: 'email',
  value: {
    stringValue: email
  }
}])

export const up: UpMigration = async (client) => {
  const transaction = await client.beginTransaction()
  try {
    await transaction.executeStatement({
      sql: 'CREATE TABLE users (id INT, email VARCHAR)'
    })
    await transaction.batchExecuteStatement({
      sql: 'INSERT INTO users (email) VALUES (:email)',
      parameterSets
    })
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error // ensure error is thrown to prevent subsequent migrations from running
  }
}

export const down: DownMigration = async (client) => {
  const transaction = await proxy.beginTransaction()
  try {
    await transaction.executeStatement({
      sql: 'DROP TABLE users'
    })
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error // ensure error is thrown to prevent subsequent rollbacks from running
  }
}
```