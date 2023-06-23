type BaseSchema = {
  key: string;
  additional?: ((val: any) => boolean)[];
}

type JSTypes = 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function'

interface GameFields {
  id: string;
  name: string;
  size: string;
}

export type Schema = BaseSchema & (
  | { type: 'string', required: boolean, array?: undefined }
  | { type: 'object', required?: undefined, array: boolean }
  | { type: JSTypes, required?: undefined, array?: undefined })

export type Players = [string, string | null]

export type GameObj = GameFields & {
  password: string
}

export type GameDto = GameFields & {
  password: boolean,
  players: Players
}

export type Ceil = null | 0 | 1
export type Pair<T = any> = [T, T]