"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

// Category data with real product images from PNI CDN
const CATEGORIES = [
  {
    name: "CB Radios",
    slug: "statii-radio-statii-cb",
    image: "https://cdn.mypni.com/products/37595_smsn.jpg",
    color: "from-blue-500/20 to-blue-600/10",
    borderColor: "border-blue-200",
    textColor: "text-blue-600"
  },
  {
    name: "CB Antennas",
    slug: "statii-radio-antene-cb",
    image: "https://cdn.mypni.com/products/63284_smsn.jpg",
    color: "from-accent-500/20 to-accent-600/10",
    borderColor: "border-accent-500/30",
    textColor: "text-accent-400"
  },
  {
    name: "Walkie Talkie",
    slug: "statii-radio-statii-pmr",
    image: "https://cdn.mypni.com/products/36743_smsn.jpg",
    color: "from-blue-500/20 to-blue-600/10",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-400"
  },
  {
    name: "Accessories",
    slug: "statii-radio-accesorii-statii-radio",
    image: "https://cdn.mypni.com/products/35002_smsn.jpg",
    color: "from-yellow-500/20 to-yellow-600/10",
    borderColor: "border-yellow-500/30",
    textColor: "text-yellow-400"
  },
  {
    name: "Auto Electronics",
    slug: "electronice-auto",
    image: "https://cdn.mypni.com/products/65576_smsn.jpg",
    color: "from-orange-500/20 to-orange-600/10",
    borderColor: "border-orange-500/30",
    textColor: "text-orange-400"
  },
  {
    name: "VHF/UHF",
    slug: "statii-radio-statii-uhfvhf",
    image: "https://cdn.mypni.com/products/64266_smsn.jpg",
    color: "from-purple-500/20 to-purple-600/10",
    borderColor: "border-purple-500/30",
    textColor: "text-purple-400"
  }
]

const CategoriesSection = () => {
  return (
    <section className="py-8 bg-gray-50" suppressHydrationWarning>
      <div className="content-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-accent-500 rounded-full"></span>
            <h2 className="text-xl font-bold text-white">Product Categories</h2>
          </div>
          <LocalizedClientLink 
            href="/categories"
            className="text-blue-600 hover:text-primary-300 text-sm font-medium flex items-center gap-1"
          >
            All categories
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </LocalizedClientLink>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-6 gap-3">
          {CATEGORIES.map((category) => (
            <LocalizedClientLink
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="group"
            >
              <div className={`bg-gradient-to-br ${category.color} border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 transition-all duration-300 hover:-translate-y-1`}>
                {/* Product Image */}
                <div className="aspect-square relative overflow-hidden bg-white">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent" />
                </div>
                {/* Label */}
                <div className="p-3 text-center">
                  <span className="text-sm font-medium text-white group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </span>
                </div>
              </div>
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CategoriesSection
