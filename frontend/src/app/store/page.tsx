import { Metadata } from "next"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const revalidate = 120

export const metadata: Metadata = {
  title: "Store | RobotixFunnel",
  description:
    "Explore all our products: CB radios, antennas, walkie talkies and accessories.",
}

type Props = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    q?: string
    brand?: string
  }>
}

export default async function StoreRootPage(props: Props) {
  const searchParams = await props.searchParams
  const { sortBy, page, q, brand } = searchParams
  const defaultCountryCode = process.env.NEXT_PUBLIC_DEFAULT_REGION || "ro"

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={defaultCountryCode}
      searchQuery={q}
      brand={brand}
    />
  )
}
