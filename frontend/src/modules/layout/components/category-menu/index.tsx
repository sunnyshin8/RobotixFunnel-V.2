"use client"

import { useState, useEffect, useRef } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Category = {
  id: string
  name: string
  handle: string
  description?: string
  parent_category_id?: string | null
  metadata?: {
    thumbnail?: string
  }
  category_children?: Category[]
}

type CategoryMenuProps = {
  countryCode: string
}

const CategoryMenu = ({ countryCode }: CategoryMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [activeParent, setActiveParent] = useState<string | null>(null)
  const [activeChild, setActiveChild] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setActiveParent(null)
        setActiveChild(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/product-categories`)
      if (res.ok) {
        const data = await res.json()
        setCategories(data.product_categories || [])
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
      setActiveParent(null)
      setActiveChild(null)
    }, 150)
  }

  const getChildren = (parentId: string | null): Category[] => {
    return categories.filter(cat => cat.parent_category_id === parentId)
  }

  const parentCategories = getChildren(null)

  return (
    <div
      ref={menuRef}
      className="relative h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Button */}
      <button
        suppressHydrationWarning
        className={"h-full px-4 flex items-center gap-2 text-sm font-medium transition-all duration-200 " + (isOpen ? "text-blue-600 bg-blue-50" : "text-clay-text-secondary hover:text-blue-600")}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span className="hidden medium:inline">Categories</span>
        <svg
          suppressHydrationWarning
          className={"w-4 h-4 transition-transform duration-200 " + (isOpen ? "rotate-180" : "")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Mega Menu Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 w-[min(800px,calc(100vw-2rem))] bg-white border border-gray-200 rounded-b-2xl shadow-xl shadow-black/8 z-[70] overflow-hidden">
          <div className="flex">
            {/* Level 1 - Parent Categories */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 max-h-[70vh] overflow-y-auto">
              <div className="p-3 border-b border-gray-200">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  All Categories
                </h3>
              </div>
              <ul className="py-2">
                {parentCategories.map((cat) => {
                  const children = getChildren(cat.id)
                  const hasChildren = children.length > 0

                  return (
                    <li key={cat.id}>
                      <div
                        className={`
                          flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-150
                          ${activeParent === cat.id
                            ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-500'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-l-2 border-transparent'
                          }
                        `}
                        onMouseEnter={() => {
                          setActiveParent(cat.id)
                          setActiveChild(null)
                        }}
                      >
                        <LocalizedClientLink
                          href={`/categories/${cat.handle}`}
                          className="flex-1 flex items-center gap-3"
                          onClick={() => setIsOpen(false)}
                        >
                          {cat.metadata?.thumbnail && (
                            <img
                              src={cat.metadata.thumbnail}
                              alt={cat.name}
                              className="w-8 h-8 rounded object-cover"
                            />
                          )}
                          <span className="font-medium">{cat.name}</span>
                        </LocalizedClientLink>
                        {hasChildren && (
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Level 2 - Subcategories */}
            {activeParent && (
              <div className="w-64 border-r border-gray-200 max-h-[70vh] overflow-y-auto">
                <div className="p-3 border-b border-gray-200 bg-gray-50/50">
                  <h3 className="text-sm font-semibold text-gray-800">
                    {categories.find(c => c.id === activeParent)?.name}
                  </h3>
                </div>
                <ul className="py-2">
                  {getChildren(activeParent).map((subcat) => {
                    const subChildren = getChildren(subcat.id)
                    const hasSubChildren = subChildren.length > 0

                    return (
                      <li key={subcat.id}>
                        <div
                          className={`
                            flex items-center justify-between px-4 py-2.5 cursor-pointer transition-all duration-150
                            ${activeChild === subcat.id
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                            }
                          `}
                          onMouseEnter={() => setActiveChild(subcat.id)}
                        >
                          <LocalizedClientLink
                            href={`/categories/${subcat.handle}`}
                            className="flex-1"
                            onClick={() => setIsOpen(false)}
                          >
                            {subcat.name}
                          </LocalizedClientLink>
                          {hasSubChildren && (
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Level 3 - Sub-subcategories */}
            {activeChild && getChildren(activeChild).length > 0 && (
              <div className="w-64 max-h-[70vh] overflow-y-auto">
                <div className="p-3 border-b border-gray-200 bg-gray-50/50">
                  <h3 className="text-sm font-semibold text-gray-800">
                    {categories.find(c => c.id === activeChild)?.name}
                  </h3>
                </div>
                <ul className="py-2">
                  {getChildren(activeChild).map((subsubcat) => (
                    <li key={subsubcat.id}>
                      <LocalizedClientLink
                        href={`/categories/${subsubcat.handle}`}
                        className="block px-4 py-2.5 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        {subsubcat.name}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Featured/Promo Area */}
            <div className="flex-1 p-6 bg-gradient-to-br from-blue-50/60 to-purple-50/60 min-w-[240px]">
              <div className="h-full flex flex-col">
                <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-4">
                  🔥 Popular now
                </h4>
                <div className="grid grid-cols-1 gap-3 flex-1">
                  <LocalizedClientLink
                    href="/store"
                    className="group flex items-center gap-3 p-3 bg-white/70 rounded-xl hover:bg-white hover:shadow-md transition-all"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-800 font-medium group-hover:text-blue-600 transition-colors">All Products</p>
                      <p className="text-xs text-gray-400">View entire store</p>
                    </div>
                  </LocalizedClientLink>

                  <LocalizedClientLink
                    href="/categories"
                    className="group flex items-center gap-3 p-3 bg-white/70 rounded-xl hover:bg-white hover:shadow-md transition-all"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-800 font-medium group-hover:text-purple-600 transition-colors">Categories</p>
                      <p className="text-xs text-gray-400">Browse by Category</p>
                    </div>
                  </LocalizedClientLink>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between">
            <LocalizedClientLink
              href="/categories"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              View all categories
            </LocalizedClientLink>
            <span className="text-xs text-gray-400">
              {parentCategories.length} main categories
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryMenu
