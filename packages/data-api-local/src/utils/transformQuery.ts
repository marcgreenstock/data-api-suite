import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'

const getId = (index: number, typeHint?: RDSDataService.Types.TypeHint): string => {
  const pos = index + 1
  switch (typeHint) {
    case 'DATE':
      return `$${pos}::date`
    case 'DECIMAL':
      return `$${pos}::double`
    case 'TIME':
      return `$${pos}::time`
    case 'TIMESTAMP':
      return `$${pos}::timestamp`
    default:
      return `$${pos}`
  }
}

const getValueFromArrayValue = (value: RDSDataService.Types.ArrayValue): unknown => {
  if ('arrayValues' in value) {
    return value.arrayValues.map(getValueFromArrayValue)
  }
  if ('booleanValues' in value) {
    return value.booleanValues
  }
  if ('doubleValues' in value) {
    return value.doubleValues
  }
  if ('longValues' in value) {
    return value.longValues
  }
  if ('stringValues' in value) {
    return value.stringValues
  }
}

const getValueFromParameter = (parameter: RDSDataService.Types.SqlParameter): unknown => {
  const { value } = parameter
  if ('arrayValue' in value) {
    return getValueFromArrayValue(value.arrayValue)
  }
  if ('blobValue' in value) {
    return value.blobValue
  }
  if ('booleanValue' in value) {
    return value.booleanValue
  }
  if ('doubleValue' in value) {
    return value.doubleValue
  }
  if ('isNull' in value) {
    return value.isNull ? 'IS NULL' : 'IS NOT NULL'
  }
  if ('longValue' in value) {
    return value.longValue
  }
  if ('stringValue' in value) {
    return value.stringValue
  }
}

export interface TransformedQuery {
  query: string;
  values?: unknown[];
}

export const transformQuery = (
  query: string,
  parameters?: RDSDataService.Types.SqlParameter[]
): TransformedQuery => {
  if (parameters === undefined) {
    return { query }
  }
  return parameters.reduce(({ query, values }, parameter, index) => {
    const value = getValueFromParameter(parameter)
    const regx = new RegExp(`:${parameter.name}\\b`, 'g')
    const id = getId(index, parameter.typeHint)
    return {
      query: query.replace(regx, id),
      values: [...values, value]
    }
  }, { query, values: [] })
}
