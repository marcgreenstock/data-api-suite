import { jsTemplate, tsTemplate } from './templates'

test('jsTemplate', () => {
  const result = jsTemplate()
  expect(typeof result).toEqual('string')
})

test('tsTemplate', () => {
  const result = tsTemplate()
  expect(typeof result).toEqual('string')
})
