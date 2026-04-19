import { getBaseURL } from "@lib/util/env"
import { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "styles/globals.css"
import ScrollToTop from "@modules/common/components/scroll-to-top"
import ClientChatBox from "@modules/layout/components/client-chat-box"
import LocationCountryBootstrap from "@modules/layout/components/location-country-bootstrap"
import Providers from "./Providers"

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
}

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "RobotixFunnel | Robotised E-Commerce — Radio & Electronics",
    template: "%s | RobotixFunnel",
  },
  description: "AI-powered robotised e-commerce for CB radios, antennas, surveillance, electronics and smart home. Automated warehouse fulfilment by Query Curious.",
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.mypni.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.mypni.com" />
        <link rel="dns-prefetch" href="https://www.mypni.eu" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <LocationCountryBootstrap />
          <main className="relative">{props.children}</main>
          <ScrollToTop />
          <ClientChatBox />
        </Providers>
      </body>
    </html>
  )
}

