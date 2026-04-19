export const isStripeLike = (providerId?: string | null) => {
  if (!providerId) {
    return false
  }

  return providerId.includes("stripe")
}

export const isManual = (providerId?: string | null) => {
  if (!providerId) {
    return false
  }

  return (
    providerId === "pp_system_default" ||
    providerId === "cod" ||
    providerId.includes("manual")
  )
}

export const paymentInfoMap: Record<string, { title: string }> = {
  cod: { title: "Cash on Delivery" },
  "bank-transfer": { title: "Bank Transfer" },
  "payu-card": { title: "Credit / Debit Card (PayU)" },
  "base-crypto": { title: "Base Network (Crypto)" },
  pp_system_default: { title: "Manual Payment" },
}
