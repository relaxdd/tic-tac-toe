import { Schema } from '../@types'

export function validateObject(
  data: any,
  schema: Schema[],
) {
  if (typeof data !== 'object') return false

  const typeUnits = (obj: Schema): boolean => {
    switch (obj.type) {
      case 'string':
        return obj.required ? data[obj.key].trim() !== '' : true
      case 'object':
        return obj.array ? Array.isArray(data[obj.key]) : true
      default:
        return true
    }
  }

  return schema.every((obj) => {
    return obj.key in data && typeof data[obj.key] === obj.type && typeUnits(obj) &&
      (obj.additional ? obj.additional.every((it) => it(data[obj.key])) : true)
  })
}

export function inverse(arr: string[], value: string) {
  const index = arr.indexOf(value)
  if (index === -1) return undefined
  return arr[Number(!Boolean(index))]
}
