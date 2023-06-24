import { IGameStore, useGameSelector } from '../store/gameStore.ts'
import GameService from '../service/GameService.ts'
import useAppStore, { useAppSelector } from '../store/appStore.ts'
import scss from './modules/Board.module.scss'

const Text = ({ gameRole }: { gameRole: string }) => {
  return (
    <p>{gameRole === 'server'
      ? 'Ожидание подключения второго игрока...'
      : 'Ожидание начала игры первым игроком...'
    }</p>
  )
}

const Board = () => {
  const arr: (keyof IGameStore)[] = ['gameRole', 'isStarted', 'myStep', 'board']
  const { gameRole, isStarted, myStep, board } = useGameSelector(...arr)
  const { myId, gameId } = useAppSelector('myId', 'gameId')
  const pushAlert = useAppStore(s => s.pushAlert)

  if (!gameRole) return null

  async function onBoardClick(r: number, c: number) {
    if (!myStep) {
      pushAlert('warning', 'Дождитесь пока сходит соперник')
      return
    }

    if (!myId || !gameId) {
      pushAlert('error', 'Ошибка клиента, нет myId или gameId')
      return
    }

    if (board[r][c] !== null) return

    await GameService.boardStep(r, c, myId, gameId)
  }

  function getCeilText(val: null | 0 | 1) {
    switch (val) {
      case null:
        return ''
      case 0:
        return 'o'
      case 1:
        return 'x'
    }
  }

  return (
    <div className="text-center text-lg-left">
      {!isStarted ?
        <Text gameRole={gameRole}/>
        : (
          <>
            <div className={scss.board}>
              {board?.map((row, r) => (
                <div className={scss.boardRow} key={r}>
                  {row.map((ceil, c) => (
                    <span
                      className={scss.boardCeil}
                      onClick={() => onBoardClick(r, c)}
                      key={c}
                    >{getCeilText(ceil)}</span>
                  ))}
                </div>
              ))}
            </div>

            <div>
              <p className={scss.text}>
                {myStep ? 'Ваш ход' : 'Ход соперника'}
              </p>
            </div>
          </>
        )}
    </div>
  )
}

export default Board
