import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"

import NativeSelect, {
  NativeSelectProps,
} from "@modules/common/components/native-select"
import { HttpTypes } from "@/types/types-compat"
import { readDetectedCountry } from "@lib/util/location-country"

const getGeneratedCountryOptions = () => {
  const displayNames = new Intl.DisplayNames(["en"], { type: "region" })
  const excludedCodes = new Set([
    "EU",
    "EZ",
    "UN",
    "XA",
    "XB",
    "XK",
    "ZZ",
    "CP",
    "DG",
    "EA",
    "IC",
    "TA",
  ])

  const options: { value: string; label: string }[] = []

  for (let first = 65; first <= 90; first++) {
    for (let second = 65; second <= 90; second++) {
      const code = String.fromCharCode(first) + String.fromCharCode(second)
      if (excludedCodes.has(code)) continue

      const label = displayNames.of(code)
      if (!label || label.toUpperCase() === code) continue

      options.push({ value: code.toLowerCase(), label })
    }
  }

  options.sort((a, b) => a.label.localeCompare(b.label))
  return options
}

const CountrySelect = forwardRef<
  HTMLSelectElement,
  NativeSelectProps & {
    region?: HttpTypes.StoreRegion
    regions?: HttpTypes.StoreRegion[]
  }
>(
  ({ placeholder = "Country", region, regions, defaultValue, ...props }, ref) => {
  const innerRef = useRef<HTMLSelectElement>(null)
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null)

  useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
    ref,
    () => innerRef.current
  )

  const countryOptions = useMemo(() => {
    const regionCountries =
      region?.countries?.map((country) => ({
        value: country.iso_2,
        label: country.display_name,
      })) ?? []

    if (regionCountries.length > 0) {
      return regionCountries
    }

    const allCountries =
      regions
        ?.flatMap((r) => r.countries ?? [])
        .map((country) => ({
          value: country.iso_2,
          label: country.display_name,
        })) ?? []

    const generatedCountries = getGeneratedCountryOptions()

    const uniqueByIso2 = new Map<string, { value: string; label: string }>()
    for (const option of [...regionCountries, ...allCountries, ...generatedCountries]) {
      if (!uniqueByIso2.has(option.value)) {
        uniqueByIso2.set(option.value, option)
      }
    }

    return Array.from(uniqueByIso2.values())
  }, [region, regions])

  useEffect(() => {
    const cached = readDetectedCountry()
    if (cached) {
      setDetectedCountry(cached)
    }
  }, [])

  useEffect(() => {
    if (!detectedCountry) return
    if (!props.onChange || !props.name) return

    const currentValue =
      typeof props.value === "string" ? props.value.trim().toLowerCase() : ""

    if (currentValue) {
      return
    }

    props.onChange({
      target: { name: props.name, value: detectedCountry },
    } as React.ChangeEvent<HTMLSelectElement>)
  }, [detectedCountry, props.name, props.onChange, props.value])

  const resolvedDefaultValue =
    defaultValue ||
    (typeof props.value === "string" && props.value.trim() ? undefined : detectedCountry || undefined)

  return (
    <NativeSelect
      ref={innerRef}
      label={placeholder}
      required={props.required}
      placeholder="Select a country..."
      defaultValue={resolvedDefaultValue}
      {...props}
    >
      {countryOptions?.map(({ value, label }, index) => (
        <option key={index} value={value}>
          {label}
        </option>
      ))}
    </NativeSelect>
  )
  }
)

CountrySelect.displayName = "CountrySelect"

export default CountrySelect
