type Board = (null | 0 | 1)[][]

type WinnerInfo =
  | { end: false }
  | { end: true, winner: number | null }

type Pair<T = any> = [T, T]
type Triple<T = any> = [T, T, T]

const Num = 3

const Dig1: Triple<Pair<number>>[] = [
  [[0, 0], [1, 1], [2, 2]],
  [[0, 1], [1, 2], [2, 3]],

  [[1, 0], [2, 1], [3, 2]],
  [[1, 1], [2, 2], [3, 3]],
]

// [1, 4, 9, 16]
// const test = [1, 4, 9, 16]
//
// const val = (() => {
//   const init: Triple<Pair<number>>[] = [
//     [[0, 0], [1, 1], [2, 2]]
//   ]
//
//   for (let i = 0; i < test[1]! - 1; i++) {
//     init.push(init[0]!.map(it => [it[0], it[1]+1]))
//   }
//
//   return init
// })()

const Dig2: Triple<Pair<number>>[] = [
  [[0, 2], [1, 1], [2, 0]],
  [[0, 3], [1, 2], [2, 1]],

  [[1, 2], [2, 1], [3, 0]],
  [[1, 3], [2, 2], [3, 1]],
]

function every<T = any>(arr: T[], cb: (it: T) => boolean, offset?: number): boolean {
  offset = offset || 0

  for (let i = offset; i < Num + offset; i++) {
    const it = arr[i]!
    if (!cb(it)) return false
  }

  return true
}

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

    const byDig = (dig: Triple<Pair<number>>[]) => {
      return this.size === 3
        ? this.dig(match, dig[0]!)
        : dig.some(it => this.dig(match, it))
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