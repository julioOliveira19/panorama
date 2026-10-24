export function nextFocusedCodes(
  current: string[],
  code: string,
  availableCodes: Set<string>,
  additive: boolean,
) {
  const valid = current.filter((item) => availableCodes.has(item))
  const alreadyFocused = valid.includes(code)

  if (additive) {
    return alreadyFocused
      ? valid.filter((item) => item !== code)
      : [...valid, code]
  }

  return alreadyFocused && valid.length === 1 ? [] : [code]
}
