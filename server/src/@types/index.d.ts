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
