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
  const value = new Date()
  const result = transformQueryParams({
    example: value
  })
  expect(result).toMatchObject([{
    name: 'example',
    typeHint: 'TIMESTAMP',
    value: {
      stringValue: value.toISOString()
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

describe('Array', () => {
  test('Booleans', () => {
    const result = transformQueryParams({
      example: [true, false, true]
    })
    expect(result).toMatchObject([{
      name: 'example',
      value: {
        arrayValue: {
          booleanValues: [true, false, true]
        }
      }
    }])
  })

  test('Strings', () => {
    const result = transformQueryParams({
      example: ['foo', 'bar', 'baz']
    })
    expect(result).toMatchObject([{
      name: 'example',
      value: {
        arrayValue: {
          stringValues: ['foo', 'bar', 'baz']
        }
      }
    }])
  })

  test('Integers', () => {
    const result = transformQueryParams({
      example: [1, 2, 3]
    })
    expect(result).toMatchObject([{
      name: 'example',
      value: {
        arrayValue: {
          longValues: [1, 2, 3]
        }
      }
    }])
  })

  test('Floats', () => {
    const result = transformQueryParams({
      example: [1.1, 2.1, 3.1]
    })
    expect(result).toMatchObject([{
      name: 'example',
      value: {
        arrayValue: {
          doubleValues: [1.1, 2.1, 3.1]
        }
      }
    }])
  })

  test('Dates', () => {
    const d1 = new Date('2019-06-20')
    const d2 = new Date('2020-06-20')
    const result = transformQueryParams({
      example: [d1, d2]
    })
    expect(result).toMatchObject([{
      name: 'example',
      typeHint: 'TIMESTAMP',
      value: {
        arrayValue: {
          stringValues: [d1.toISOString(), d2.toISOString()]
        }
      }
    }])
  })

  test('Nested array', () => {
    const result = transformQueryParams({
      example: [[1, 2], [3, 4], [5, 6]]
    })
    expect(result).toMatchObject([{
      name: 'example',
      value: {
        arrayValue: {
          arrayValues: [{
            longValues: [1, 2]
          }, {
            longValues: [3, 4]
          }, {
            longValues: [5, 6]
          }]
        }
      }
    }])
  })

  test('Mixed array', () => {
    /**
     * In practice mixed arrays are not supported by Postgres or MySQL, but the
     * RDSDataService or database should throw an error. This library should not
     * validate input beyond the what is required for the transformation.
    */
    const result = transformQueryParams({
      example: [['a', 'b'], [1, 2]]
    })
    expect(result).toMatchObject([{
      name: 'example',
      value: {
        arrayValue: {
          arrayValues: [{
            stringValues: ['a', 'b']
          }, {
            longValues: [1, 2]
          }]
        }
      }
    }])
  })

  test('Unknown', () => {
    expect(() => {
      transformQueryParams({
        example: [new WeirdClass()] as unknown
      })
    }).toThrow(new Error(`Could not transform "example" to an SqlParameter. Reason: "Type not supported."`))
  })

  describe('CustomValue', () => {
    const result = transformQueryParams({
      example: [new SpecialValue('egg'), new SpecialValue('cheese'), new SpecialValue('milk')]
    })
    expect(result).toMatchObject([{
      name: 'example',
      typeHint: 'special',
      value: {
        arrayValue: {
          stringValues: ['egg', 'cheese', 'milk']
        }
      }
    }])
  })
})
