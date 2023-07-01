interface BaseSchema {
  key: string,
  additional?: ((val: any) => boolean)[]
}

type JSTypes = 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'function'

export type Schema =
  | BaseSchema & { type: JSTypes }
  | BaseSchema & { type: 'string', required?: boolean }
  | BaseSchema & { type: 'object', array?: boolean }
  | BaseSchema & { type: 'number', integer?: boolean }

// *****************************

export type Players = [string, string | null]

interface GameFields {
  id: string;
  name: string;
  size: string;
}

export type GameObj = GameFields & {
  password: string
}

export type GameDto = GameFields & {
  password: boolean,
  players: Players
}

export type Ceil = null | 0 | 1
export type Pair<T = any> = [T, T]