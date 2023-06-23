const arr = [
  [null, 0, 1],
  [1   , 0, 0],
  [null, 0, 1]
]

// Всего 8 комбинаций победы

function isWin(i) {
  for (const row of arr) {
    const win = row.every(ceil => ceil === i)
    if (win) return true
  }

  for (let col = 0; col < 3; col++) {
    const win = arr.every(row => row[col] === i)
    if (win) return true
  }

  const dig1 = arr[0][0] === i && arr[1][1] === i && arr[2][2] === i
  if (dig1) return true

  const dig2 = arr[0][2] === i && arr[1][1] === i && arr[2][0] === i
  if (dig2) return true

  return false
}

function checkWinner() {
  let winner = null

  const is = [0, 1].some((i) => {
    if (!isWin(i)) return false
    winner = i
    return true
  })

  return !is ? { end: false } : { end: true, winner }
}

console.log(checkWinner())


