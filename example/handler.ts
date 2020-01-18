import * as AWSLambda from 'aws-lambda'
import * as AuroraDataAPI from 'aurora-data-api'
import { getEnv } from './utils/getEnv'

interface Todo {
  id: number;
  name: string;
  createdAt: Date;
  completedAt: Date;
}

const dataAPI = new AuroraDataAPI({
  region: process.env.REGION,
  endpoint: process.env.IS_OFFLINE ? 'http://localhost:8080' : undefined,
  secretArn: getEnv('DATA_API_SECRET_ARN'),
  resourceArn: getEnv('DATA_API_RESOURCE_ARN'),
  database: getEnv('DATABASE_NAME')
})

export const todoIndex: AWSLambda.APIGatewayProxyHandler = async () => {
  const result = await dataAPI.query<Todo>('SELECT * FROM todos ORDER BY "createdAt" ASC')
  return {
    statusCode: 200,
    body: JSON.stringify(result.rows)
  }
}

export const todoShow: AWSLambda.APIGatewayProxyHandler = async (event) => {
  if (event.pathParameters === null) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: '400 Bad request'
      })
    }
  }
  const id = parseInt(event.pathParameters.id)
  const result = await dataAPI.query<Todo>('SELECT * FROM todos WHERE id = :id LIMIT 1', { id })
  if (result.rows && result.rows.length > 0) {
    return {
      statusCode: 200,
      body: JSON.stringify(result.rows[0])
    }
  }
  return {
    statusCode: 404,
    body: JSON.stringify({
      error: '404 Not Found'
    })
  }
}