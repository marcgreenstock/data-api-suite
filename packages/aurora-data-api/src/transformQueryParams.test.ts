import transformQueryParams from './transformQueryParams'

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

test('boolean', () => {
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

test('string', () => {
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

test('integer', () => {
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

test('float', () => {
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

describe('arrays', () => {
  test('booleans', () => {
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

  test('strings', () => {
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

  test('integers', () => {
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

  test('floats', () => {
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

  test('nested array', () => {
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
})
