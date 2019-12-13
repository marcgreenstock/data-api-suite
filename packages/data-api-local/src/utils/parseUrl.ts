import { URL } from 'url'
import {
  MySQLConnectionOptions,
  PostgresConnectionOptions,
  engines
} from '../Server'

export const parseUrl = (urlString: string): MySQLConnectionOptions | PostgresConnectionOptions => {
  const url = new URL(urlString)
  let engine: engines
  if (/mysql:$/.test(url.protocol)) {
    engine = 'mysql'
  } else if (/postgres:$/.test(url.protocol)) {
    engine = 'postgres'
  }
  const host = url.hostname !== null ? url.hostname : undefined
  const port = url.port !== null ? parseInt(url.port) : undefined
  const user = url.username
  const password = url.password
  const database = url.pathname !== null ? url.pathname : undefined
  return {
    engine,
    port,
    host,
    user,
    password,
    database
  }
}
