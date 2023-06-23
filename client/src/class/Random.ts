/**
 * @author awenn2015
 * @version 1.0.0
 */
class Random {
  public static int(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  public static shuffle<T = any>(array: T[]): T[] {
    return array.sort(() => Math.random() - 0.5)
  }

  // /** @deprecated */
  // public static uuidv2(len: number, special: boolean, digits = false) {
  //   const frequency = 4
  //   // const list = ['!', '@', '#', '$', '%', '&']

  //   const qty = Math.floor(len / frequency)
  //   const uuid = this.uuid(len - qty)

  //   return uuid.length
  // }

  public static letterCase(char: string, lower: boolean | number) {
    return lower ? char.toLowerCase() : char.toUpperCase()
  }

  public static range(full: number, need: number): [number, number] {
    const edge = full - need
    const start = this.int(0, edge)
    const finish = full - (edge - start)

    return [start, finish]
  }

  public static uuid(len = 13): string {
    let uuid = this.generateUuid()

    const slice = () => {
      const range = this.range(uuid.length, len)
      const list = uuid.split('').slice(...range)

      return list.join('')
    }

    if (uuid.length === len)
      return uuid

    if (uuid.length > len)
      return slice()

    while (uuid.length < len)
      uuid += this.generateUuid()

    return slice()
  }

  public static getPartOf(arr: string[], len: number, range = false) {
    return range
      ? arr.slice(...this.range(arr.length, len))
      : (() => {
        const list: string[] = []

        while (list.length < len) {
          const char = arr[this.int(0, arr.length - 1)]!
          if (!list.includes(char)) list.push(char)
        }

        return list
      })()
  }

  /* Private methods */

  private static generateUuid() {
    const part = this.getAlphabetPart()
    const char = (n: number) => Random.letterCase(part[n]!, this.int(0, 1))
    const list = String(Date.now()).split('')

    return this.shuffle(list.map(n => char(+n))).join('')
  }

  private static getAlphabetPart(range = false) {
    const alphabet = [
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
      'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    ]

    return this.getPartOf(alphabet, 10, range)
  }
}

export default Random