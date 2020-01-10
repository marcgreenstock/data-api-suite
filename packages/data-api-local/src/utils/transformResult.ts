import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { QueryResult, types, FieldDef } from 'pg'
import { TypeId } from 'pg-types'

const transformStringValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value
  } else {
    return JSON.stringify(value)
  }
}

const parseTimestamp = (value: string): string => {
  return new Date(value).toISOString()
}

const parseLongValue = (value: unknown): number => {
  if (typeof value === 'string') {
    return parseInt(value)
  } else {
    return value as number
  }
}

const transformArray = (typeId: TypeId, array: unknown[]): RDSDataService.Types.ArrayValue => {
  if (Array.isArray(array[0])) {
    return { arrayValues: array.map((value) => transformArray(typeId, value as unknown[])) }
  }
  switch (typeId) {
    case 1000:
      return { booleanValues: array as boolean[] }
    case 1115:
    case 1182:
    case 1185:
      return { stringValues: array.map((value) => parseTimestamp(value as string)) }
    case 1005:
    case 1007:
    case 1028:
      return { longValues: array.map((value) => parseLongValue(value)) }
    case 1021:
    case 1022:
      return { doubleValues: array as number[] }
    default:
      return { stringValues: array.map((value) => transformStringValue(value)) }
  }
}

const transformValue = (field: FieldDef, value: unknown): RDSDataService.Types.Field => {
  if (value === null) {
    return { isNull: true }
  } else {
    if (Array.isArray(value)) {
      return { arrayValue: transformArray(field.dataTypeID, value) }
    }
    switch (field.dataTypeID) {
      case types.builtins.BOOL:
        return { booleanValue: value as boolean }
      case types.builtins.BYTEA:
        return { blobValue: value }
      case types.builtins.INT2:
      case types.builtins.INT4:
      case types.builtins.INT8:
        return { longValue: parseLongValue(value) }
      case types.builtins.FLOAT4:
      case types.builtins.FLOAT8:
        return { doubleValue: value as number }
      case types.builtins.TIMESTAMP:
      case types.builtins.TIMESTAMPTZ:
        return { stringValue: parseTimestamp(value.toString()) }
      default:
        return { stringValue: transformStringValue(value) }
    }
  }
}

export const transformResult = (result: QueryResult): RDSDataService.Types.SqlRecords => {
  return result.rows.map((columns) => {
    return columns.map((value: unknown, index: number) => {
      const field = result.fields[index]
      return transformValue(field, value)
    })
  })
}
