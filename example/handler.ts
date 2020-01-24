import * as AWSLambda from 'aws-lambda'
import * as AuroraDataAPI from 'aurora-data-api'
import * as createError from 'http-errors'
import * as yup from 'yup'
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
  database: getEnv('DATABASE_NAME'),
  credentials: {
    accessKeyId: 'example',
    secretAccessKey: 'example'
  }
})

const parseEventBody = (event: AWSLambda.APIGatewayEvent): { [key: string]: unknown } => {
  if (event.body === null) {
    throw new createError.BadRequest('JSON body is required in request')
  }
  try {
    return JSON.parse(event.body)
  } catch (error) {
    throw new createError.BadRequest(error.message)
  }
}

const parseEventId = (event: AWSLambda.APIGatewayEvent): number => {
  if (event.pathParameters === null) {
    throw new createError.NotFound()
  }
  const id = parseInt(event.pathParameters.id)
  if (isNaN(id)) {
    throw new createError.NotFound()
  }
  return id
}

const handleError = (error: Error): AWSLambda.APIGatewayProxyResult => {
  const statusCode = error instanceof createError.HttpError ? error.statusCode : 500
  return {
    statusCode,
    body: JSON.stringify({
      error: error.message
    })
  }
}

export const todoIndex: AWSLambda.APIGatewayProxyHandler = async () => {
  try {
    const result = await dataAPI.query<Todo>('SELECT * FROM todos ORDER BY "createdAt" ASC')
    return {
      statusCode: 200,
      body: JSON.stringify(result.rows)
    }
  } catch (error) {
    return handleError(error)
  }
}

export const todoShow: AWSLambda.APIGatewayProxyHandler = async (event) => {
  try {
    const id = parseEventId(event)
    const { rows } = await dataAPI.query<Todo>('SELECT * FROM todos WHERE id = :id LIMIT 1', { id })
    if (rows === null || rows.length <= 0) {
      throw new createError.NotFound()
    }
    return {
      statusCode: 200,
      body: JSON.stringify(rows[0])
    }
  } catch (error) {
    return handleError(error)
  }
}

export const createTodo: AWSLambda.APIGatewayProxyHandler = async (event) => {
  try {
    const { name } = yup.object({
      name: yup.string().required()
    }).validateSync(parseEventBody(event))
    const { rows } = await dataAPI.query<Todo>('INSERT INTO todos (name) VALUES (:name) RETURNING *', { name })
    if (rows === null || rows.length <= 0) {
      throw new createError.InternalServerError('Failed to insert')
    }
    return {
      statusCode: 201,
      body: JSON.stringify(rows[0])
    }
  } catch (error) {
    return handleError(error)
  }
}

export const updateTodo: AWSLambda.APIGatewayProxyHandler = async (event) => {
  try {
    const id = parseEventId(event)
    const { name, completedAt } = yup.object({
      name: yup.string(),
      completedAt: yup.date()
    }).validateSync(parseEventBody(event))
    const { rows } = await dataAPI.query<Todo>(
      'UPDATE todos SET name = :name, "completedAt" = :completedAt WHERE id = :id RETURNING *',
      { id, name, completedAt })
    if (rows === null || rows.length <= 0) {
      throw new createError.InternalServerError('Failed to update')
    }
    return {
      statusCode: 200,
      body: JSON.stringify(rows[0])
    }
  } catch (error) {
    return handleError(error)
  }
}
