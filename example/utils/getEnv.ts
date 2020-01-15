export const getEnv = (name: string): string => {
  const value = process.env[name]
  if (value !== undefined) {
    return value
  } else {
    throw new Error(`process.env.${name} is undefined`)
  }
}
