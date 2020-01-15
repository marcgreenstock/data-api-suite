import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'

export type ParamValue = string | number | boolean
export type ParamArrayValue = (string | number | boolean | ParamArrayValue)[]
export interface QueryParams {
  [name: string]: ParamValue | ParamArrayValue | Omit<RDSDataService.SqlParameter, 'name'>;
}

const transformParamArrayValue = (paramValueArray: ParamArrayValue): RDSDataService.ArrayValue => {
  return paramValueArray.reduce<RDSDataService.ArrayValue>((result, paramValue) => {
    if (paramValue instanceof Array) {
      const arrayValues = result.arrayValues || []
      return {
        ...result,
        arrayValues: [...arrayValues, transformParamArrayValue(paramValue)]
      }
    }
    if (typeof paramValue === 'boolean') {
      const booleanValues = result.booleanValues || []
      return {
        ...result,
        booleanValues: [...booleanValues, paramValue]
      }
    }
    if (typeof paramValue === 'number') {
      if (Number.isInteger(paramValue)) {
        const longValues = result.longValues || []
        return {
          ...result,
          longValues: [...longValues, paramValue]
        }
      }
      const doubleValues = result.doubleValues || []
      return {
        ...result,
        doubleValues: [...doubleValues, paramValue]
      }
    }
    const stringValues = (result.stringValues || []).map((v) => v.toString())
    return {
      ...result,
      stringValues: [...stringValues, paramValue]
    }
  }, {})
} 

const transformParamValue = (value: ParamValue | ParamArrayValue): RDSDataService.Field => {
  if (Array.isArray(value)) {
    return { arrayValue: transformParamArrayValue(value) }
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value }
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { longValue: value }
    } else {
      return { doubleValue: value }
    }
  }
  return { stringValue: value }
}

export const transformQueryParams = (params: QueryParams): RDSDataService.SqlParametersList => {
  return Object.entries(params).map(([name, paramValue]) => {
    if (typeof paramValue === 'object' && !Array.isArray(paramValue)) {
      return { name, ...paramValue }
    }
    const value = transformParamValue(paramValue)
    return { name, value }
  })
}

export default transformQueryParams