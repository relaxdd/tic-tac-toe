export function inverse(arr: string[], value: string) {
  const index = arr.indexOf(value)
  if (index === -1) return undefined
  return arr[Number(!Boolean(index))]
}
