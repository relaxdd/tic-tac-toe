import { Schema } from '../@types'
import { validateObject } from './utils'

type SchemaKeys = 'create' | 'join' | 'step' | 'cancel'

const schemes: Record<SchemaKeys, Schema[]> = {
  create: [
    { type: 'string', key: 'name', required: true },
    { type: 'string', key: 'password' },
    {
      type: 'string',
      key: 'size',
      required: true,
      additional: [
        function (val: string) {
          const split = val.split('x')
          return !(new Set(split).size === split.length)
        },
      ],
    },
  ],
  join: [
    { type: 'string', key: 'gameId', required: true },
    { type: 'string', key: 'playerId', required: true },
    { type: 'string', key: 'password' },
  ],
  step: [
    { type: 'object', key: 'pos', array: true },
    { type: 'string', key: 'playerId', required: true },
    { type: 'string', key: 'gameId', required: true },
  ],
  cancel: [
    { type: 'string', key: 'playerId', required: true },
    { type: 'string', key: 'gameId', required: true },
  ],
}

export function validateSchema(name: SchemaKeys, obj: any) {
  const schema = schemes[name]
  return validateObject(obj, schema)
}

export default schemes