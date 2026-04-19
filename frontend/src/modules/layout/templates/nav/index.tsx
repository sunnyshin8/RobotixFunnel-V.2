import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { StoreRegion } from "@/types/types-compat"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import HeaderSearch from "@modules/layout/components/header-search"
import CategoryMenu from "@modules/layout/components/category-menu"
import { getWarehouseURL } from "@lib/util/env"

export default async function Nav() {
  let regions: StoreRegion[] = []
  let locales: any[] = []
  let currentLocale: any = null

  try {
    const [_regions, _locales, _currentLocale] = await Promise.all([
      listRegions().then((regions: StoreRegion[]) => regions),
      listLocales(),
      getLocale(),
    ])
    regions = _regions || []
    locales = _locales || []
    currentLocale = _currentLocale
    console.log("✅ Nav: Regions loaded successfully", { count: regions?.length, regions })
  } catch (e) {
    // Backend unreachable — use defaults so the page still renders
    console.error("❌ Nav: Failed to fetch data from backend", {
      error: e instanceof Error ? e.message : String(e),
      backend_url: process.env.NEXT_PUBLIC_BACKEND_URL
    })
  }

  const countryCode = regions?.[0]?.countries?.[0]?.iso_2 || "ro"
  const warehouseURL = getWarehouseURL()

  return (
    <div className="relative z-[60]">
      {/* Top bar with phone & info - Light Theme */}
      <div className="bg-clay-bg text-clay-text-secondary py-1.5 text-[10px] uppercase tracking-widest hidden small:block border-b border-gray-200">
        <div className="content-container flex justify-between items-center px-6">
          <div className="flex items-center gap-6">
            <a href="tel:+40774077860" className="flex items-center gap-2 hover:text-clay-text-primary transition-all duration-300 group">
              <span className="font-bold">+91 93295 44611</span>
            </a>
            <span className="text-gray-300">/</span>
            <span className="font-medium">Premium European Logistics</span>
          </div>
          <div className="flex items-center gap-6">
            <a href={warehouseURL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-all duration-300 font-bold">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
              LIVE CONSOLE
            </a>
          </div>
        </div>
      </div>

      {/* Main header - Premium Frosted Glass */}
      <header className="relative z-[60] h-20 mx-auto duration-500 header-clay group-hover:bg-white/90">
        <nav className="content-container flex items-center justify-between w-full h-full px-6" aria-label="Main navigation">
          {/* Left - Category Menu */}
          <div className="flex-1 basis-0 h-full flex items-center gap-4">
            <div className="h-full small:hidden">
              <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
            </div>

            <div className="hidden small:block h-full">
              <CategoryMenu countryCode={countryCode} />
            </div>

            <LocalizedClientLink
              className="hidden medium:flex items-center gap-2 text-clay-text-primary hover:text-blue-600 transition-all duration-300 text-[11px] font-bold uppercase tracking-widest px-4 h-10 rounded-full bg-clay-bg hover:bg-white shadow-inner"
              href="/store"
            >
              Store
            </LocalizedClientLink>
          </div>

          {/* Center - Logo */}
          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="flex items-center gap-3 group"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-500 text-white transform group-hover:rotate-6">
                  <span className="font-black text-lg">R</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-clay-text-primary tracking-tight">
                  ROBOTIX<span className="text-blue-600">FUNNEL</span>
                </span>
              </div>
            </LocalizedClientLink>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-x-4 h-full flex-1 basis-0 justify-end">
            <HeaderSearch countryCode={countryCode} />

            <div className="hidden small:flex items-center gap-x-4 h-full">
              <LocalizedClientLink
                className="flex items-center gap-2 text-clay-text-secondary hover:text-clay-text-primary transition-all duration-300"
                href="/account"
              >
                <div className="w-10 h-10 rounded-full bg-clay-bg flex items-center justify-center shadow-clay-button hover:shadow-clay-button-active transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </LocalizedClientLink>
            </div>

            <Suspense
              fallback={
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
