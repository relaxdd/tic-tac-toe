import { Schema } from './@types'

type SchemaKeys = 'create' | 'join' | 'step'

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
}

export default schemes