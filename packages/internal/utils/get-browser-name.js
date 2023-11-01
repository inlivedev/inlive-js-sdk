export const CHROME = 'Chrome',
  FIREFOX = 'Firefox',
  SAFARI = 'Safari',
  OPERA = 'Opera',
  IE = 'IE',
  EDGE = 'Edge'

export const getBrowserName = () => {
  if (
    navigator.userAgent.includes(CHROME) &&
    navigator.userAgent.includes(EDGE)
  )
    return EDGE
  if (
    navigator.userAgent.includes(CHROME) &&
    navigator.userAgent.includes(OPERA)
  )
    return OPERA
  if (navigator.userAgent.includes(CHROME)) return CHROME
  if (navigator.userAgent.includes(FIREFOX)) return FIREFOX
  if (navigator.userAgent.includes(SAFARI)) return SAFARI
  if (navigator.userAgent.includes(IE)) return IE
  return null
}
