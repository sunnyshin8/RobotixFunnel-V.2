"use client"

import { useState } from "react"

type BaseCart = {
  id: string
  item_subtotal?: number | null
  shipping_total?: number | null
  total?: number | null
  currency_code?: string | null
}

type BasePaymentWrapperProps = {
  cart: BaseCart
  children: React.ReactNode
}

/**
 * Base payment MVP wrapper.
 *
 * For hackathon/demo this wrapper provides tx-hash verification flow.
 * Once OnchainKit is installed, this component can render OnchainKit Checkout.
 */
export default function BasePaymentWrapper({ cart, children }: BasePaymentWrapperProps) {
  const [txHash, setTxHash] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9000"
  const verifiedKey = `base_payment_verified_${cart.id}`

  const fixedShippingRate = 3000
  const freeShippingThreshold = 60000
  const itemSubtotal = cart.item_subtotal ?? 0
  const shippingTotal = cart.shipping_total ?? 0
  const qualifiesForFreeShipping = itemSubtotal >= freeShippingThreshold
  const effectiveShipping =
    shippingTotal && shippingTotal > 0
      ? shippingTotal
      : qualifiesForFreeShipping
        ? 0
        : fixedShippingRate
  const expectedAmount = Math.max(0, Math.round((cart.total || 0) - shippingTotal + effectiveShipping))

  const verifyTransaction = async () => {
    if (!txHash.trim()) {
      setVerifyMessage("Please paste a transaction hash first.")
      return
    }

    setVerifying(true)
    setVerifyMessage(null)

    try {
      const response = await fetch(`${backendUrl}/store/payments/verify-base`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: cart.id,
          txHash: txHash.trim(),
          expectedCurrency: (cart.currency_code || "").toUpperCase(),
          expectedAmount,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Verification failed")
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(verifiedKey, "true")
        window.localStorage.setItem(`base_payment_tx_${cart.id}`, txHash.trim())
      }

      setVerifyMessage("Base payment verified successfully. You can continue checkout.")
    } catch (error: any) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(verifiedKey)
      }
      setVerifyMessage(error?.message || "Unable to verify Base payment")
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div>
      <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-semibold">Base Crypto Payment</p>
        <p className="mt-1">Pay on Base, then paste the tx hash to verify on-chain settlement.</p>
      </div>

      <div className="mb-6 flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Base Transaction Hash</label>
        <input
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          placeholder="0x..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <div>
          <button
            type="button"
            onClick={verifyTransaction}
            disabled={verifying}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {verifying ? "Verifying..." : "Verify Base Payment"}
          </button>
        </div>
        {verifyMessage && <p className="text-sm text-gray-600">{verifyMessage}</p>}
      </div>

      {children}
    </div>
  )
}
