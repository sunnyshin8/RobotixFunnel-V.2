"use client"

import { readDetectedCountry, writeDetectedCountry } from "@lib/util/location-country"
import { useEffect } from "react"

type PositionResult = {
  latitude: number
  longitude: number
}

const getCurrentPosition = (): Promise<PositionResult | null> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.navigator?.geolocation) {
      resolve(null)
      return
    }

    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => resolve(null),
      {
        enableHighAccuracy: false,
        timeout: 7000,
        maximumAge: 5 * 60 * 1000,
      }
    )
  })
}

const detectCountryCode = async () => {
  const position = await getCurrentPosition()

  const gpsUrl =
    position !== null
      ? `/api/location/country?lat=${encodeURIComponent(String(position.latitude))}&lon=${encodeURIComponent(String(position.longitude))}`
      : null

  if (gpsUrl) {
    const gpsResponse = await fetch(gpsUrl)
    if (gpsResponse.ok) {
      const gpsData = await gpsResponse.json()
      if (gpsData?.countryCode) {
        return gpsData.countryCode as string
      }
    }
  }

  const fallbackResponse = await fetch("/api/location/country")
  if (!fallbackResponse.ok) {
    return null
  }

  const fallbackData = await fallbackResponse.json()
  if (!fallbackData?.countryCode) {
    return null
  }

  return fallbackData.countryCode as string
}

export default function LocationCountryBootstrap() {
  useEffect(() => {
    const run = async () => {
      const cachedCountry = readDetectedCountry()
      if (cachedCountry) {
        return
      }

      const countryCode = await detectCountryCode()
      if (!countryCode) {
        return
      }

      writeDetectedCountry(countryCode)
    }

    run()
  }, [])

  return null
}
