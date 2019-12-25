import * as createError from 'http-errors'
import { transformQuery } from './transformQuery'

describe('flat values', () => {
  test('booleanValue', () => {
    const result = transformQuery('SELECT :trueValue, :falseValue', [{
      name: 'trueValue',
      value: {
        booleanValue: true
      }
    }, {
      name: 'falseValue',
      value: {
        booleanValue: false
      }
    }])
    expect(result).toMatchObject({
      query: 'SELECT $1::boolean, $2::boolean',
      values: ['true', 'false']
    })
  })

  test('doubleValue', () => {
    const result = transformQuery('SELECT :doubleValue', [{
      name: 'doubleValue',
      value: {
        doubleValue: 42.42
      }
    }])
    expect(result).toMatchObject({
      query: 'SELECT $1::float',
      values: ['42.42']
    })
  })

  test('isNull', () => {
    const result = transformQuery('SELECT :isNull', [{
      name: 'isNull',
      value: {
        isNull: true
      }
    }])
    expect(result).toMatchObject({
      query: 'SELECT $1',
      values: [null]
    })
  })

  test('longValue', () => {
    const result = transformQuery('SELECT :longValue', [{
      name: 'longValue',
      value: {
        longValue: 42
      }
    }])
    expect(result).toMatchObject({
      query: 'SELECT $1::int',
      values: ['42']
    })
  })

  test('blobValue', () => {
    const result = transformQuery('SELECT :blobValue', [{
      name: 'blobValue',
      value: {
        blobValue: 'i am a file'
      }
    }])
    expect(result).toMatchObject({
      query: 'SELECT $1::bytea',
      values: ['i am a file']
    })
  })

  test('stringValue', () => {
    const result = transformQuery('SELECT :textValue, :dateValue, :doubleValue, :timeValue, :timestampValue', [{
      name: 'textValue',
      value: {
        stringValue: 'i am a string'
      }
    }, {
      name: 'dateValue',
      typeHint: 'DATE',
      value: {
        stringValue: '2019-12-16'
      }
    }, {
      name: 'doubleValue',
      typeHint: 'DOUBLE',
      value: {
        stringValue: '22.995'
      }
    }, {
      name: 'timeValue',
      typeHint: 'TIME',
      value: {
        stringValue: '16:32'
      }
    }, {
      name: 'timestampValue',
      typeHint: 'TIMESTAMP',
      value: {
        stringValue: '2019-12-16 16:32'
      }
    }])
    expect(result).toMatchObject({
      query: 'SELECT $1::text, $2::date, $3::float, $4::time, $5::timestamp',
      values: ['i am a string', '2019-12-16', '22.995', '16:32', '2019-12-16 16:32']
    })
  })
})

describe('array values', () => {
  test('booleanValue', () => {
    const result = transformQuery('SELECT :arrayValue, :nestedArrayValue', [{
      name: 'arrayValue',
      value: {
        arrayValue: {
          booleanValues: [true, false]
        }
      }
    }, {
      name: 'nestedArrayValue',
      value: {
        arrayValue: {
          arrayValues: [{
            booleanValues: [false, false, true]
          }, {
            booleanValues: [true, true, false]
          }]
        }
      }
    }])
    expect(result).toMatchObject({
      query: 'SELECT $1::boolean[], $2::boolean[][]',
      values: [
        ['true', 'false'],
        [['false', 'false', 'true'], ['true', 'true', 'false']],
      ]
    })
  })

  test('doubleValues', () => {
    const result = transformQuery('SELECT :arrayValue, :nestedArrayValue', [{
      name: 'arrayValue',
      value: {
        arrayValue: {
          doubleValues: [42.42, 12.99]
        }
      }
    }, {
      name: 'nestedArrayValue',
      value: {
        arrayValue: {
          arrayValues: [{
            doubleValues: [99.1234, 88.9918]
          }, {
            doubleValues: [82.7675, 761.2221]
          }]
        }
      }
    }])
    expect(result).toMatchObject({
      query: 'SELECT $1::float[], $2::float[][]',
      values: [
        ['42.42', '12.99'],
        [['99.1234', '88.9918'], ['82.7675', '761.2221']]
      ]
    })
  })

  test('longValues', () => {
    const result = transformQuery('SELECT :arrayValue, :nestedArrayValue', [{
      name: 'arrayValue',
      value: {
        arrayValue: {
          longValues: [21, 191]
        }
      }
    }, {
      name: 'nestedArrayValue',
      value: {
        arrayValue: {
          arrayValues: [{
            longValues: [66, 991]
          }, {
            longValues: [82, 121]
          }]
        }
      }
    }])
    expect(result).toMatchObject({
      query: 'SELECT $1::int[], $2::int[][]',
      values: [
        ['21', '191'],
        [['66', '991'], ['82', '121']]
      ]
    })
  })

  test('stringValues', () => {
    const result = transformQuery('SELECT :arrayValue, :nestedArrayValue', [{
      name: 'arrayValue',
      value: {
        arrayValue: {
          stringValues: ['foo', 'bar']
        }
      }
    }, {
      name: 'nestedArrayValue',
      value: {
        arrayValue: {
          arrayValues: [{
            stringValues: ['egg', 'bacon']
          }, {
            stringValues: ['pancakes', 'beans']
          }]
        }
      }
    }])
    expect(result).toMatchObject({
      query: 'SELECT $1::text[], $2::text[][]',
      values: [
        ['foo', 'bar'],
        [['egg', 'bacon'], ['pancakes', 'beans']]
      ]
    })
  })

  test('repeating values', () => {
    const result = transformQuery('SELECT :one, :two, :one, :three, :two', [{
      name: 'one',
      value: {
        longValue: 1
      }
    }, {
      name: 'two',
      value: {
        longValue: 2
      }
    }, {
      name: 'three',
      value: {
        longValue: 3
      }
    }])
    expect(result).toMatchObject({
      query: 'SELECT $1::int, $2::int, $1::int, $3::int, $2::int',
      values: ['1', '2', '3']
    })
  })
})

describe('error handeling', () => {
  test('undefined parameter name', () => {
    try {
      transformQuery('SELECT :foo', [{ value: {  stringValue: 'bar' } }])
    } catch (error) {
      expect(error).toBeInstanceOf(createError.BadRequest)
      expect(error.message).toEqual('Named parameter name is empty')
    }
  })

  test('null parameter name', () => {
    try {
      transformQuery('SELECT :foo', [{ name: null, value: {  stringValue: 'bar' } }])
    } catch (error) {
      expect(error).toBeInstanceOf(createError.BadRequest)
      expect(error.message).toEqual('Named parameter name is empty')
    }
  })

  test('empty parameter name', () => {
    try {
      transformQuery('SELECT :foo', [{ name: '', value: {  stringValue: 'bar' } }])
    } catch (error) {
      expect(error).toBeInstanceOf(createError.BadRequest)
      expect(error.message).toEqual('Named parameter name is empty')
    }
  })
})
