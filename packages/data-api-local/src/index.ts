import { Server, ServerOptions } from './Server'
export * from './Server'
export * from './Client'

export const dataApiLocal = async (
  options: ServerOptions
): Promise<Server> => {
  return new Server(options).start()
}
