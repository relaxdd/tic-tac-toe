type Board = (null | 0 | 1)[][]

type WinnerInfo =
  | { end: false }
  | { end: true, winner: number | null }

type Pair<T = any> = [T, T]
type Triple<T = any> = [T, T, T]
type BoardSizes = '3x3' | '4x4' | '5x5'
type BoardMap = { size: number, path: BoardSizes }[]
type DigCoordsMap = Record<BoardSizes, Triple<Pair<number>>[]>

const Num = 3

const Dig1: DigCoordsMap = {
  '3x3': [
    [[0, 0], [1, 1], [2, 2]],
  ],
  '4x4': [
    [[0, 0], [1, 1], [2, 2]],
    [[0, 1], [1, 2], [2, 3]],
    [[1, 0], [2, 1], [3, 2]],
    [[1, 1], [2, 2], [3, 3]],
  ],
  '5x5': [
    [[0, 0], [1, 1], [2, 2]],
    [[0, 1], [1, 2], [2, 3]],
    [[0, 2], [1, 3], [2, 4]],
    [[1, 0], [2, 1], [3, 2]],
    [[1, 1], [2, 2], [3, 3]],
    [[1, 2], [2, 3], [3, 4]],
    [[2, 0], [3, 1], [4, 2]],
    [[2, 1], [3, 2], [4, 3]],
    [[2, 2], [3, 3], [4, 4]],
  ],
}

const Dig2: DigCoordsMap = {
  '3x3': [
    [[0, 2], [1, 1], [2, 0]],
  ],
  '4x4': [
    [[0, 2], [1, 1], [2, 0]],
    [[0, 3], [1, 2], [2, 1]],
    [[1, 2], [2, 1], [3, 0]],
    [[1, 3], [2, 2], [3, 1]],
  ],
  '5x5': [
    [[0, 2], [1, 1], [2, 0]],
    [[0, 3], [1, 2], [2, 1]],
    [[0, 4], [1, 3], [2, 2]],
    [[1, 2], [2, 1], [3, 0]],
    [[1, 3], [2, 2], [3, 1]],
    [[1, 4], [2, 3], [3, 2]],
    [[2, 2], [3, 1], [4, 0]],
    [[2, 3], [3, 2], [4, 1]],
    [[2, 4], [3, 3], [4, 2]],
  ],
}

const sizes: BoardMap = [
  { size: 3, path: '3x3' },
  { size: 4, path: '4x4' },
  { size: 5, path: '5x5' },
]

function every<T = any>(arr: T[], cb: (it: T) => boolean, offset?: number): boolean {
  offset = offset || 0

  for (let i = offset; i < Num + offset; i++) {
    const it = arr[i]!
    if (!cb(it)) return false
  }

  return true
}

// ************************

class MatchWinner {
  private readonly board: Board
  private readonly size: number

  public constructor(board: Board, size: number) {
    if (size < Num) {
      const err = `Размер доски не может быть меньше ${Num} клеток!`
      throw new Error(err)
    }

    this.board = board
    this.size = size
  }

  public check(): WinnerInfo {
    let winner: number | null = null

    const helper = (i: number) => {
      if (!this.isSomeWin(i)) return false
      winner = i
      return true
    }

    const is = [0, 1].some(helper)
    return !is ? { end: false } : { end: true, winner }
  }

  private isSomeWin(match: number) {
    const byLine = (fn: (x: number, offset?: number) => boolean) => {
      for (let x = 0; x < this.size; x++) {
        const win = this.size > 3
          ? this.getOffsets().some((i) => fn(x, i))
          : fn(x)

        if (win) return true
      }

      return false
    }

    const byDig = (dig: DigCoordsMap) => {
      const key = sizes.find(it => it.size === this.size)!.path

      return this.size === 3
        ? this.dig(match, dig[key][0]!)
        : dig[key].some(it => this.dig(match, it))
    }

    // ********* Смотрим победу по строкам ********* //

    if (byLine((x, i) => {
      return every(this.board[x]!, (ceil) => ceil === match, i)
    })) return true

    // ********* Смотрим победу по колонкам ********* //

    if (byLine((x, i) => {
      return every(this.board, (row) => row[x] === match, i)
    })) return true

    // ********* Смотрим победу по левой диагонали ********* /

    if (byDig(Dig1)) return true

    // ********* Смотрим победу по правой диагонали ********* //

    return byDig(Dig2)
  }

  private dig(match: number, coords: Triple<Pair<number>>) {
    for (let i = 0; i < Num; i++) {
      const r = coords[i]![0]!
      const c = coords[i]![1]!

      const item = this.board?.[r]?.[c]

      if (item !== match) return false
    }

    return true
  }

  private getOffsets() {
    return [...Array(this.size - Num + 1).keys()]
  }
}

export default MatchWinner