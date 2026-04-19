const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9000"

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = (data && (data.message || data.error)) || "Request failed"
    throw new Error(message)
  }

  return data as T
}

export async function createPaymentCollection(cartId: string) {
  const data = await request<{ payment_collection: { id: string } }>(`/store/payment-collections`, {
    method: "POST",
    body: JSON.stringify({ cart_id: cartId }),
  })

  return data.payment_collection
}

export async function createPaymentSession(paymentCollectionId: string, providerId: string) {
  const data = await request<{ payment_session: unknown }>(
    `/store/payment-collections/${paymentCollectionId}/payment-sessions`,
    {
      method: "POST",
      body: JSON.stringify({ provider_id: providerId }),
    }
  )

  return data.payment_session
}

export async function initiatePaymentSession(cart: any, payload: { provider_id: string }) {
  let paymentCollectionId = cart?.payment_collection?.id

  if (!paymentCollectionId) {
    const paymentCollection = await createPaymentCollection(cart.id)
    paymentCollectionId = paymentCollection?.id
  }

  if (!paymentCollectionId) {
    throw new Error("Unable to initialize payment collection")
  }

  return createPaymentSession(paymentCollectionId, payload.provider_id)
}

export async function updateCart(cartId: string, payload: Record<string, unknown>) {
  return request<{ cart: any }>(`/store/carts/${cartId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function setShippingMethod(cartId: string, payload: { option_id: string }) {
  return request<{ cart: any }>(`/store/carts/${cartId}/shipping-methods`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function addToCart({
  cartId,
  variantId,
  quantity,
  countryCode,
}: {
  cartId: string
  variantId: string
  quantity: number
  countryCode?: string
}) {
  return request<{ cart: any }>(`/store/carts/${cartId}/line-items`, {
    method: "POST",
    body: JSON.stringify({ variant_id: variantId, quantity, country_code: countryCode }),
  })
}

export async function setAddresses(_prevState: any, formData: FormData) {
  const cartId = String(formData.get("cart_id") || "")

  if (!cartId) {
    return "Missing cart id"
  }

  const shippingAddress = {
    first_name: String(formData.get("shipping_address.first_name") || ""),
    last_name: String(formData.get("shipping_address.last_name") || ""),
    address_1: String(formData.get("shipping_address.address_1") || ""),
    company: String(formData.get("shipping_address.company") || ""),
    postal_code: String(formData.get("shipping_address.postal_code") || ""),
    city: String(formData.get("shipping_address.city") || ""),
    country_code: String(formData.get("shipping_address.country_code") || ""),
    province: String(formData.get("shipping_address.province") || ""),
    phone: String(formData.get("shipping_address.phone") || ""),
  }

  const billingAddress = {
    first_name: String(formData.get("billing_address.first_name") || ""),
    last_name: String(formData.get("billing_address.last_name") || ""),
    address_1: String(formData.get("billing_address.address_1") || ""),
    company: String(formData.get("billing_address.company") || ""),
    postal_code: String(formData.get("billing_address.postal_code") || ""),
    city: String(formData.get("billing_address.city") || ""),
    country_code: String(formData.get("billing_address.country_code") || ""),
    province: String(formData.get("billing_address.province") || ""),
    phone: String(formData.get("billing_address.phone") || ""),
  }

  const email = String(formData.get("email") || "")

  await updateCart(cartId, {
    shipping_address: shippingAddress,
    billing_address: billingAddress,
    email,
  })

  return null
}

export async function placeOrder() {
  return request<{ order: any }>(`/store/orders`, {
    method: "POST",
    body: JSON.stringify({}),
  })
}

export async function completeCartForPayU(cartId: string) {
  return request<{ order: any }>(`/store/carts/${cartId}/complete`, {
    method: "POST",
    body: JSON.stringify({ provider: "payu" }),
  })
}
