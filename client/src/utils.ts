import { RoleWinner } from './service/GameService.ts'

export function isWinner(role: string | null, data: RoleWinner) {
  return role === 'server' && data === 1 || role === 'client' && data === 0
}