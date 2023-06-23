export type GameObj = {
  id: string;
  name: string;
  password: boolean;
  size: string;
  players: [string, string | null]
};

export type GameDto = Omit<GameObj, 'password' | 'players'> & { password: string }