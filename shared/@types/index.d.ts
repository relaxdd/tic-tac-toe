export type GameObj = {
  id: string;
  name: string;
  password: boolean;
  size: string;
  players: [string, string | null]
};

export type GameDto = Omit<GameObj, 'password' | 'players'> & { password: string }
export type GameRoles = 'server' | 'client' | null
export type BoardState = (0 | 1 | null)[][]

export interface GameState {
  isStarted: boolean,
  isMyStep: boolean,
  gameRole: GameRoles,
  board: BoardState
}

export declare module EventsBody {
  interface Connect {
    base: {
      myId: string,
      gameId: string | null,
      isInGame: boolean,
      games: GameObj[],
      players: number,
    }
    game?: GameState
  }

  interface Start {
    board: BoardState,
    role: GameRoles
  }
}