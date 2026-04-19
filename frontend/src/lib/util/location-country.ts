export const LOCATION_COUNTRY_STORAGE_KEY = "rf_detected_country"
export const LOCATION_COUNTRY_TS_KEY = "rf_detected_country_ts"
export const LOCATION_COUNTRY_TTL_MS = 24 * 60 * 60 * 1000

export const normalizeCountryCode = (value?: string | null) => {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (!/^[a-z]{2}$/.test(normalized)) return null
  return normalized
}

export const readDetectedCountry = () => {
  if (typeof window === "undefined") return null

  const country = normalizeCountryCode(window.localStorage.getItem(LOCATION_COUNTRY_STORAGE_KEY))
  const tsRaw = window.localStorage.getItem(LOCATION_COUNTRY_TS_KEY)
  const ts = tsRaw ? Number(tsRaw) : NaN

  if (!country || Number.isNaN(ts)) {
    return null
  }

  if (Date.now() - ts > LOCATION_COUNTRY_TTL_MS) {
    return null
  }

  return country
}

export const writeDetectedCountry = (countryCode: string) => {
  if (typeof window === "undefined") return

  const normalized = normalizeCountryCode(countryCode)
  if (!normalized) return

  window.localStorage.setItem(LOCATION_COUNTRY_STORAGE_KEY, normalized)
  window.localStorage.setItem(LOCATION_COUNTRY_TS_KEY, String(Date.now()))
}
