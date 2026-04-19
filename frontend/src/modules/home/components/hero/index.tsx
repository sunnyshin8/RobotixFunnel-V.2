import { Heading } from "@/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getWarehouseURL } from "@lib/util/env"

const Hero = () => {
  const warehouseURL = getWarehouseURL()

  return (
    <div className="relative w-full overflow-hidden bg-clay-bg min-h-[90vh] flex items-center">
      {/* Soft Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-clay-accent-purple mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-clay-accent-blue mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 content-container py-10 small:py-14 large:py-20">
        <div className="grid grid-cols-1 large:grid-cols-2 gap-16 items-center">

          {/* Left side */}
          <div className="text-center large:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full mb-8 shadow-clay-button">
              <span className="w-2 h-2 bg-green-400 rounded-full" aria-hidden="true"></span>
              <span className="text-sm text-clay-text-secondary font-bold tracking-wide uppercase">AI-Powered Logistics</span>
            </div>

            <Heading
              level="h1"
              className="text-5xl small:text-6xl large:text-7xl font-extrabold text-clay-text-primary leading-[1.1] mb-6 tracking-tight"
            >
              Robotised<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                E-Commerce
              </span>
            </Heading>

            <p className="text-lg text-clay-text-secondary max-w-xl mx-auto large:mx-0 mb-10 leading-relaxed">
              Premium electronics delivered with robotic precision.
              Experience the future of fulfilment through our
              <span className="font-semibold text-clay-text-primary"> Digital Twin </span> technology.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col small:flex-row gap-6 justify-center large:justify-start mb-12">
              <LocalizedClientLink href="/store">
                <button
                  className="btn-primary flex items-center justify-center gap-3 w-full small:w-auto text-lg"
                  aria-label="Browse all products"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Browse Store
                </button>
              </LocalizedClientLink>

              <a href={warehouseURL} target="_blank" rel="noopener noreferrer">
                <button
                  className="btn-secondary flex items-center justify-center gap-3 w-full small:w-auto text-lg text-clay-text-primary"
                  aria-label="Watch robots in action"
                >
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Live View
                </button>
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-x-8 gap-y-4 justify-center large:justify-start">
              {[
                { label: "24-month warranty", color: "text-blue-500" },
                { label: "30-day returns", color: "text-purple-500" },
                { label: "Free shipping > €50", color: "text-green-500" }
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-clay-text-secondary bg-white/50 px-3 py-1 rounded-lg">
                  <svg className={`w-5 h-5 ${badge.color}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Floating 3D Card */}
          <div className="relative max-w-lg mx-auto large:mx-0 perspective-1000">
            {/* Main Clay Card */}
            <div className="product-card p-8 relative z-10 transform transition-transform hover:scale-[1.02] duration-500 bg-white">
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Live Feed</span>
                  </div>
                  <h3 className="text-3xl font-bold text-clay-text-primary">Warehouse 1</h3>
                </div>
                <div className="bg-gray-100 p-2 rounded-xl">
                  <span className="text-2xl">🏭</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { val: "4", label: "Active Robots", icon: "🤖" },
                  { val: "98%", label: "Efficiency", icon: "⚡" },
                  { val: "1.7k", label: "Products", icon: "📦" },
                  { val: "12ms", label: "Latency", icon: "📶" }
                ].map((stat, i) => (
                  <div key={i} className="bg-clay-bg p-4 rounded-2xl shadow-inner">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xl">{stat.icon}</span>
                      <span className="text-lg font-bold text-clay-text-primary">{stat.val}</span>
                    </div>
                    <span className="text-[10px] font-bold text-clay-text-secondary uppercase">{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* Action */}
              <a href={warehouseURL} target="_blank" rel="noopener noreferrer" className="block">
                <button className="w-full py-4 bg-clay-bg rounded-xl text-clay-text-primary font-bold shadow-clay-button hover:shadow-clay-button-active transition-all flex items-center justify-center gap-2">
                  <span>Enter Simulation</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </a>
            </div>

            {/* Decorative floating elements behind */}
            <div className="absolute top-10 -right-10 w-20 h-20 bg-blue-100 rounded-2xl shadow-clay-card -z-10 rotate-12"></div>
            <div className="absolute -bottom-5 -left-5 w-24 h-24 bg-purple-100 rounded-full shadow-clay-card -z-10"></div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Hero
