"use client"

import React from "react"

type ProvidersProps = {
  children: React.ReactNode
}

/**
 * Base/Web3 provider shell.
 *
 * NOTE:
 * This keeps app wiring stable even if OnchainKit deps are not installed yet.
 * Once deps are available, replace internals with:
 * WagmiProvider + QueryClientProvider + OnchainKitProvider.
 */
export default function Providers({ children }: ProvidersProps) {
  const apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || ""
  const network = process.env.NEXT_PUBLIC_BASE_NETWORK || "base-sepolia"

  return (
    <div
      data-onchainkit-api-key={apiKey ? "configured" : "missing"}
      data-base-network={network}
    >
      {children}
    </div>
  )
}
