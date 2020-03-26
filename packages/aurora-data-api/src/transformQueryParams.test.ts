import { transformQueryParams, SqlParameter, CustomValue } from './transformQueryParams'
import { BlobValue, JSONValue } from './customValues'

class WeirdClass {}

class SpecialValue implements CustomValue {
  public value: string

  constructor (value: string) {
    this.value = value
  }

  toSqlParameter (): SqlParameter {
    return {
      typeHint: 'special',
      value: {
        stringValue: this.value
      }
    }
  }
}

test('SqlParameter', () => {
  const result = transformQueryParams({
    example: {
      typeHint: 'json',
      value: {
        stringValue: '{"foo": "bar"}'
      }
    }
  })
  expect(result).toMatchObject([{
    name: 'example',
    typeHint: 'json',
    value: {
      stringValue: '{"foo": "bar"}'
    }
  }])
})

test('Null', () => {
  const result = transformQueryParams({
    example: null
  })
  expect(result).toMatchObject([{
    name: 'example',
    value: {
      isNull: true
    }
  }])
})

test('Boolean', () => {
  const result = transformQueryParams({
    example: true
  })
  expect(result).toMatchObject([{
    name: 'example',
    value: {
      booleanValue: true
    }
  }])
})

test('Buffer', () => {
  const value = Buffer.from('i is a buffer')
  const result = transformQueryParams({
    example: value
  })
  expect(result).toMatchObject([{
    name: 'example',
    value: {
      blobValue: value
    }
  }])
})

test('Uint8Array', () => {
  const value = Uint8Array.from([1, 2, 3])
  const result = transformQueryParams({
    example: value
  })
  expect(result).toMatchObject([{
    name: 'example',
    value: {
      blobValue: value
    }
  }])
})

test('BlobValue', () => {
  const result = transformQueryParams({
    example: new BlobValue('i is a blob')
  })
  expect(result).toMatchObject([{
    name: 'example',
    value: {
      blobValue: 'i is a blob'
    }
  }])
})

test('JSONValue', () => {
  const data = { foo: 'bar' }
  const result = transformQueryParams({
    example: new JSONValue(data)
  })
  expect(result).toMatchObject([{
    name: 'example',
    typeHint: 'json',
    value: {
      stringValue: JSON.stringify(data)
    }
  }])
})

test('Date', () => {
  const date = new Date()
  const y = date.getUTCFullYear().toString()
  const m = (date.getUTCMonth() + 1).toString().padStart(2, '0')
  const d = date.getUTCDay().toString().padStart(2, '0')
  const h = date.getUTCHours().toString().padStart(2, '0')
  const min = date.getUTCMinutes().toString().padStart(2, '0')
  const sec = date.getUTCSeconds().toString().padStart(2, '0')
  const ms = date.getUTCMilliseconds().toString()
  const result = transformQueryParams({
    example: date
  })
  expect(result).toMatchObject([{
    name: 'example',
    typeHint: 'TIMESTAMP',
    value: {
      stringValue: `${y}-${m}-${d} ${h}:${min}:${sec}.${ms}`
    }
  }])
})

test('String', () => {
  const result = transformQueryParams({
    example: 'hello world'
  })
  expect(result).toMatchObject([{
    name: 'example',
    value: {
      stringValue: 'hello world'
    }
  }])
})

test('Integer', () => {
  const result = transformQueryParams({
    example: 996
  })
  expect(result).toMatchObject([{
    name: 'example',
    value: {
      longValue: 996
    }
  }])
})

test('Float', () => {
  const result = transformQueryParams({
    example: 123.45
  })
  expect(result).toMatchObject([{
    name: 'example',
    value: {
      doubleValue: 123.45
    }
  }])
})

test('Unknown', () => {
  expect(() => {
    transformQueryParams({
      example: new WeirdClass() as unknown
    })
  }).toThrow(new Error(`Could not transform "example" to an SqlParameter. Reason: "Type not supported."`))
})

test('CustomValue', () => {
  const result = transformQueryParams({
    example: new SpecialValue('egg')
  })
  expect(result).toMatchObject([{
    name: 'example',
    typeHint: 'special',
    value: {
      stringValue: 'egg'
    }
  }])
})
