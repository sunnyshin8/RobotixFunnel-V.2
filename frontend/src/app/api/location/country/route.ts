import { NextRequest, NextResponse } from "next/server"

type ProviderResult = {
  countryCode: string
  source: string
}

const normalizeCountryCode = (value?: string | null) => {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (!/^[a-z]{2}$/.test(normalized)) return null
  return normalized
}

const getFromCloudflareHeader = (request: NextRequest): ProviderResult | null => {
  const headerCountry = normalizeCountryCode(request.headers.get("cf-ipcountry"))
  if (!headerCountry || headerCountry === "xx") {
    return null
  }

  return { countryCode: headerCountry, source: "cloudflare-header" }
}

const getFromGps = async (lat: string, lon: string): Promise<ProviderResult | null> => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=3&addressdetails=1&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
    {
      headers: {
        "User-Agent": "RobotixFunnel/1.0",
      },
      cache: "no-store",
    }
  )

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  const countryCode = normalizeCountryCode(data?.address?.country_code)

  if (!countryCode) {
    return null
  }

  return { countryCode, source: "gps-nominatim" }
}

const getFromIpWhoIs = async (): Promise<ProviderResult | null> => {
  const response = await fetch("https://ipwho.is/", { cache: "no-store" })
  if (!response.ok) {
    return null
  }

  const data = await response.json()
  if (!data?.success) {
    return null
  }

  const countryCode = normalizeCountryCode(data?.country_code)
  if (!countryCode) {
    return null
  }

  return { countryCode, source: "ipwhois" }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const lat = url.searchParams.get("lat")
  const lon = url.searchParams.get("lon")

  try {
    const cloudflareCountry = getFromCloudflareHeader(request)
    if (cloudflareCountry) {
      return NextResponse.json(cloudflareCountry)
    }

    if (lat && lon) {
      const gpsCountry = await getFromGps(lat, lon)
      if (gpsCountry) {
        return NextResponse.json(gpsCountry)
      }
    }

    const ipCountry = await getFromIpWhoIs()
    if (ipCountry) {
      return NextResponse.json(ipCountry)
    }

    return NextResponse.json(
      {
        error: "Unable to detect country",
      },
      { status: 404 }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Failed to detect country",
      },
      { status: 500 }
    )
  }
}
