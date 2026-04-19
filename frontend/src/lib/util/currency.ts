export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  in: "INR",
  ro: "RON",
}

export const getCurrencyForCountry = (
  countryCode?: string | null,
  fallbackCurrency = "RON"
) => {
  const normalizedCountry = (countryCode || "").trim().toLowerCase()
  const normalizedFallback = (fallbackCurrency || "RON").trim().toUpperCase()

  return COUNTRY_CURRENCY_MAP[normalizedCountry] || normalizedFallback
}

export const formatAmount = (amountMinor: number, currencyCode: string) => {
  const normalizedCurrency = (currencyCode || "RON").toUpperCase()
  const valueMajor = (amountMinor || 0) / 100

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalizedCurrency,
    maximumFractionDigits: 2,
  }).format(valueMajor)
}

export const convertMinorAmount = async (
  amountMinor: number,
  fromCurrency: string,
  toCurrency: string
) => {
  const from = (fromCurrency || "").toUpperCase()
  const to = (toCurrency || "").toUpperCase()

  if (!from || !to || from === to) {
    return {
      amountMinor: Math.max(0, Math.round(amountMinor || 0)),
      rate: 1,
      converted: false,
    }
  }

  const response = await fetch(`https://open.er-api.com/v6/latest/${from}`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`FX lookup failed with status ${response.status}`)
  }

  const data = await response.json()
  const rate = Number(data?.rates?.[to])

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`FX rate unavailable for ${from} to ${to}`)
  }

  const majorAmount = (amountMinor || 0) / 100
  const convertedMajor = majorAmount * rate

  return {
    amountMinor: Math.max(0, Math.round(convertedMajor * 100)),
    rate,
    converted: true,
  }
}
