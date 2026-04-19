import { NextRequest, NextResponse } from "next/server"

type StoreRegion = {
  id: string
  name: string
  currency_code: string
  tax_rate: number
  countries?: { iso_2?: string; name?: string }[]
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9000"
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "ro"

const regionMapCache = {
  regionMap: new Map<string, StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) {
    throw new Error(
      "Middleware.ts: NEXT_PUBLIC_BACKEND_URL environment variable is not set."
    )
  }

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    try {
      const response = await fetch(`${BACKEND_URL}/store/regions`, {
        next: {
          revalidate: 3600,
          tags: [`regions-${cacheId}`],
        },
        cache: "force-cache",
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message)
      }

      const { regions } = json

      if (!regions?.length) {
        // No regions configured yet — fall back to default region
        console.warn("No regions found from backend. Using default region.")
        regionMapCache.regionMap.set(DEFAULT_REGION, {
          id: "default",
          name: "Default",
          currency_code: "RON",
          tax_rate: 19,
          countries: [{ iso_2: DEFAULT_REGION, name: DEFAULT_REGION.toUpperCase() }],
        })
        regionMapCache.regionMapUpdated = Date.now()
        return regionMapCache.regionMap
      }

      // Create a map of country codes to regions.
      regions.forEach((region: StoreRegion) => {
        region.countries?.forEach((c) => {
          regionMapCache.regionMap.set(c.iso_2 ?? "", region)
        })
      })

      regionMapCache.regionMapUpdated = Date.now()
    } catch (error) {
      console.error("Failed to fetch regions from backend:", error)
      // Fallback: create a default region so the app can still load
      if (!regionMapCache.regionMap.size) {
        regionMapCache.regionMap.set(DEFAULT_REGION, {
          id: "default",
          name: "Default",
          currency_code: "RON",
          tax_rate: 19,
          countries: [{ iso_2: DEFAULT_REGION, name: DEFAULT_REGION.toUpperCase() }],
        })
        regionMapCache.regionMapUpdated = Date.now()
      }
    }
  }

  return regionMapCache.regionMap
}

/**
 * Fetches regions from the backend and sets the region cookie.
 * @param request
 * @param regionMap
 */
async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, StoreRegion | number>
) {
  try {
    let countryCode

    const vercelCountryCode = request.headers
      .get("x-vercel-ip-country")
      ?.toLowerCase()

    const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

    if (urlCountryCode && regionMap.has(urlCountryCode)) {
      countryCode = urlCountryCode
    } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
      countryCode = vercelCountryCode
    } else if (regionMap.has(DEFAULT_REGION)) {
      countryCode = DEFAULT_REGION
    } else if (regionMap.keys().next().value) {
      countryCode = regionMap.keys().next().value
    }

    return countryCode
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Middleware.ts: Error getting the country code. Ensure regions are configured and NEXT_PUBLIC_BACKEND_URL is set."
      )
    }
  }
}

/**
 * Middleware to handle region selection and onboarding status.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Keep top-level /store routes as-is so the storefront can run without country prefix.
  if (pathname === "/store" || pathname.startsWith("/store/")) {
    return NextResponse.next()
  }

  let redirectUrl = request.nextUrl.href

  let response = NextResponse.redirect(redirectUrl, 307)

  let cacheIdCookie = request.cookies.get("_rf_cache_id")

  let cacheId = cacheIdCookie?.value || crypto.randomUUID()

  const regionMap = await getRegionMap(cacheId)

  const countryCode = regionMap && (await getCountryCode(request, regionMap))

  const urlHasCountryCode =
    countryCode && request.nextUrl.pathname.split("/")[1] === countryCode

  // if one of the country codes is in the url and the cache id is set, return next
  if (urlHasCountryCode && cacheIdCookie) {
    return NextResponse.next()
  }

  // if one of the country codes is in the url and the cache id is not set, set the cache id and continue (not redirect)
  if (urlHasCountryCode && !cacheIdCookie) {
    const nextResponse = NextResponse.next()
    nextResponse.cookies.set("_rf_cache_id", cacheId, {
      maxAge: 60 * 60 * 24,
    })
    return nextResponse
  }

  // check if the url is a static asset
  if (request.nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  const redirectPath =
    request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname

  const queryString = request.nextUrl.search ? request.nextUrl.search : ""

  // If no country code is set, we rewrite to the relevant region (URL stays clean).
  if (!urlHasCountryCode && countryCode) {
    const rewriteUrl = new URL(`/${countryCode}${redirectPath}${queryString}`, request.url)
    const rewriteResponse = NextResponse.rewrite(rewriteUrl)
    
    if (!cacheIdCookie) {
      rewriteResponse.cookies.set("_rf_cache_id", cacheId, { maxAge: 60 * 60 * 24 })
    }
    
    return rewriteResponse
  } else if (!urlHasCountryCode && !countryCode) {
    // Handle case where no valid country code exists (empty regions)
    return new NextResponse(
      "No valid regions configured. Please add regions with countries in the admin dashboard.",
      { status: 500 }
    )
  }

  // If we made it here, url Has Country Code. Return normal response.
  if (!cacheIdCookie) {
    response.cookies.set("_rf_cache_id", cacheId, { maxAge: 60 * 60 * 24 })
  }
  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
