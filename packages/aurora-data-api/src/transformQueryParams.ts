import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'
import * as Errors from './Errors'

type ParamValue = null | string | number | boolean | Buffer | Uint8Array | Date | CustomValue
type ParamArray = (boolean | string | number | Date | CustomValue | ParamArray)[]

export interface CustomValue {
  toSqlParameter (): SqlParameter;
}
export type SqlParameter = Omit<RDSDataService.SqlParameter, 'name'>
export type QueryParam = ParamValue | ParamArray | SqlParameter
export interface QueryParams {
  [name: string]: QueryParam;
}

const formatISO9075 = (date: Date): string => {
  const y = date.getUTCFullYear().toString()
  const m = (date.getUTCMonth() + 1).toString().padStart(2, '0')
  const d = date.getUTCDay().toString().padStart(2, '0')
  const h = date.getUTCHours().toString().padStart(2, '0')
  const min = date.getUTCMinutes().toString().padStart(2, '0')
  const sec = date.getUTCSeconds().toString().padStart(2, '0')
  const ms = date.getUTCMilliseconds().toString()
  return `${y}-${m}-${d} ${h}:${min}:${sec}.${ms}`
}

const isSqlParameter = (param: QueryParam): param is SqlParameter => {
  const keys = ['arrayValue', 'blobValue', 'booleanValue', 'doubleValue', 'isNull', 'longValue', 'stringValue']
  return param !== null &&
    typeof param === 'object' &&
    'value' in param &&
    typeof param.value === 'object' &&
    Object.keys(param.value).some((key) => keys.includes(key))
}

const isBlob = (param: QueryParam): param is Buffer | Uint8Array => {
  return param !== null &&
    typeof param === 'object' && (
      Buffer.isBuffer(param) ||
      param instanceof Uint8Array
    )
}

const isCustomValue = (param: QueryParam): param is CustomValue => {
  return typeof param === 'object' && typeof param['toSqlParameter'] === 'function'
}

const mergeArrayValue = <K extends keyof RDSDataService.ArrayValue>(
  result: SqlParameter,
  key: K,
  value: RDSDataService.ArrayValue[K][0]
): SqlParameter => ({
  ...result,
  value: {
    ...result.value,
    arrayValue: {
      ...result.value.arrayValue,
      [key]: [
        ...result.value.arrayValue[key] || [],
        value
      ]
    }
  }
})

const transformQueryParamArray = (paramArray: ParamArray): SqlParameter => {
  return paramArray.reduce<SqlParameter>((result, value) => {
    switch (typeof value) {
      case 'object':
        if (Array.isArray(value)) {
          const sqlParameter = transformQueryParamArray(value)
          return mergeArrayValue({
            ...result,
            typeHint: sqlParameter.typeHint
          }, 'arrayValues', sqlParameter.value.arrayValue)
        }
        if (isCustomValue(value)) {
          const sqlParameter = value.toSqlParameter()
          return Object.entries(sqlParameter.value).reduce((result, [key, value]) => {
            const pluralKey = `${key}s` as keyof RDSDataService.ArrayValue
            return mergeArrayValue(result, pluralKey, value)
          }, {
            ...result,
            typeHint: sqlParameter.typeHint
          })
        }
        if (value instanceof Date) {
          return mergeArrayValue({
            ...result,
            typeHint: 'TIMESTAMP'
          }, 'stringValues', value.toISOString())
        }
        break
      case 'boolean':
        return mergeArrayValue(result, 'booleanValues', value)
      case 'number':
        if (Number.isInteger(value)) {
          return mergeArrayValue(result, 'longValues', value)
        } else {
          return mergeArrayValue(result, 'doubleValues', value)
        }
      case 'string':
        return mergeArrayValue(result, 'stringValues', value)
    }
    throw new Error('Type not supported.')
  }, {
    value: {
      arrayValue: {}
    }
  })
}

const transformQueryParam = (value: QueryParam): SqlParameter => {
  if (value === null || value === undefined) {
    return { value: { isNull: true } }
  }
  switch (typeof value) {
    case 'object':
      if (isSqlParameter(value)) {
        return value
      }
      if (isBlob(value)) {
        return { value: { blobValue: value.valueOf() } }
      }
      if (Array.isArray(value)) {
        return transformQueryParamArray(value)
      }
      if (isCustomValue(value)) {
        return value.toSqlParameter()
      }
      if (value instanceof Date) {
        return {
          typeHint: 'TIMESTAMP',
          value: {
            stringValue: formatISO9075(value)
          }
        }
      }
      break
    case 'boolean':
      return { value: { booleanValue: value } }
    case 'number':
      if (Number.isInteger(value)) {
        return { value: { longValue: value } }
      } else {
        return { value: { doubleValue: value }}
      }
    case 'string':
      return { value: { stringValue: value } }
  }
  throw new Error('Type not supported.')
}

export const transformQueryParams = (params: QueryParams): SqlParameter[] => {
  return Object.entries(params).map(([name, paramValue]) => {
    try {
      const sqlParameter = transformQueryParam(paramValue)
      return { name, ...sqlParameter }
    } catch (error) {
      throw new Errors.QueryParamError(name, error)
    }
  })
}
