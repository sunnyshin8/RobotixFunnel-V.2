"use client"

import { isManual, isStripeLike } from "../../../../lib/constants"
import { placeOrder } from "../../../../lib/data/cart"
import { HttpTypes } from "@/types/types-compat"
import { Button } from "@/components/ui"
import { convertMinorAmount, getCurrencyForCountry } from "@lib/util/currency"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useState, useEffect } from "react"
import ErrorMessage from "../error-message"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const [selectedPayment, setSelectedPayment] = useState<string>('')
  const paymentSession = cart.payment_collection?.payment_sessions?.[0]
  
  // Resolve selected payment deterministically to avoid stale global localStorage values.
  useEffect(() => {
    const providerId = paymentSession?.provider_id

    if (providerId && providerId !== 'pp_system_default') {
      setSelectedPayment(providerId)
      return
    }

    if (typeof window !== 'undefined' && cart?.id) {
      const cartScoped = window.localStorage.getItem(`selectedPaymentMethod_${cart.id}`) || ''
      setSelectedPayment(cartScoped)
    }
  }, [cart?.id, paymentSession?.provider_id])
  
  // Check if shipping is configured (either robotix shipping methods OR fixed-rate courier in metadata)
  const hasShipping = (cart?.shipping_methods?.length ?? 0) > 0 || !!cart?.metadata?.courier
  
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    !hasShipping

  // PayU card payment — redirect to PayU hosted page
  if (selectedPayment === 'payu-card') {
    return (
      <PayUPaymentButton
        notReady={notReady}
        cart={cart}
        data-testid={dataTestId}
      />
    )
  }

  if (selectedPayment === 'base-crypto') {
    return (
      <ManualTestPaymentButton
        notReady={notReady}
        data-testid={dataTestId}
        requiresBaseVerification
        cartId={cart.id}
      />
    )
  }
  
  // For manual payments (COD, Bank Transfer), always use the manual payment button
  const isManualPayment = isManual(paymentSession?.provider_id) || 
    paymentSession?.provider_id === "pp_system_default" ||
    !paymentSession // If no payment session exists, use manual button

  switch (true) {
    case isStripeLike(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isManualPayment:
      return (
        <ManualTestPaymentButton notReady={notReady} data-testid={dataTestId} />
      )
    default:
      // Fallback to manual payment button for any unrecognized payment methods
      return <ManualTestPaymentButton notReady={notReady} data-testid={dataTestId} />
  }
}

const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err: unknown) => {
        setErrorMessage(err instanceof Error ? err.message : "Payment failed")
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("card")

  const session = cart.payment_collection?.payment_sessions?.find(
    (s: any) => s.status === "pending"
  )

  const disabled = !stripe || !elements ? true : false

  const handlePayment = async () => {
    setSubmitting(true)

    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false)
      return
    }

    const clientSecret = session?.data?.client_secret as string | undefined
    if (!clientSecret) {
      setErrorMessage("Missing payment session. Please try selecting payment method again.")
      setSubmitting(false)
      return
    }

    await stripe
      .confirmCardPayment(clientSecret, {
        payment_method: {
          card: card,
          billing_details: {
            name:
              cart.billing_address?.first_name +
              " " +
              cart.billing_address?.last_name,
            address: {
              city: cart.billing_address?.city ?? undefined,
              country: cart.billing_address?.country_code ?? undefined,
              line1: cart.billing_address?.address_1 ?? undefined,
              line2: cart.billing_address?.address_2 ?? undefined,
              postal_code: cart.billing_address?.postal_code ?? undefined,
              state: cart.billing_address?.province ?? undefined,
            },
            email: cart.email,
            phone: cart.billing_address?.phone ?? undefined,
          },
        },
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          const pi = error.payment_intent

          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            onPaymentCompleted()
          }

          setErrorMessage(error.message || null)
          return
        }

        if (
          (paymentIntent && paymentIntent.status === "requires_capture") ||
          paymentIntent.status === "succeeded"
        ) {
          return onPaymentCompleted()
        }

        return
      })
  }

  return (
    <>
      <Button
        disabled={disabled || notReady}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        data-testid={dataTestId}
        className="w-full bg-gradient-to-r from-blue-500 to-accent-500 hover:from-blue-600 hover:to-accent-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg"
      >
        💳 Place Order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

const ManualTestPaymentButton = ({ 
  notReady,
  requiresBaseVerification = false,
  cartId,
  "data-testid": dataTestId 
}: { 
  notReady: boolean
  requiresBaseVerification?: boolean
  cartId?: string
  "data-testid"?: string  
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    try {
      await placeOrder()
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred. Please try again.")
      setSubmitting(false)
    }
  }

  const handlePayment = () => {
    if (requiresBaseVerification && cartId && typeof window !== 'undefined') {
      const verified = window.localStorage.getItem(`base_payment_verified_${cartId}`)
      if (verified !== 'true') {
        setErrorMessage('Please verify your Base transaction hash before placing the order.')
        return
      }
    }

    setSubmitting(true)
    setErrorMessage(null)
    onPaymentCompleted()
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid={dataTestId || "submit-order-button"}
        className="w-full bg-gradient-to-r from-blue-500 to-accent-500 hover:from-blue-600 hover:to-accent-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg"
      >
        {requiresBaseVerification ? '🪙 Place Base Order' : '🛒 Place Order'}
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}

export default PaymentButton

// ─── PayU Payment Button ───
// Calls PayU API to create order, then redirects user to PayU payment page
const PayUPaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handlePayUPayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    try {
      // DO NOT call placeOrder() here — it triggers redirect() which throws NEXT_REDIRECT
      // Instead: Create PayU order → redirect to PayU → complete robotix order on return

      // Keep PayU amount aligned with cart summary total (including fallback shipping).
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

      const totalAmount = Math.max(
        0,
        Math.round((cart.total || 0) - shippingTotal + effectiveShipping)
      )
      const cartCurrency = (cart.currency_code || 'RON').toUpperCase()
      const shippingCountry = (cart?.shipping_address?.country_code || 'ro').toLowerCase()
      let payuCurrency = getCurrencyForCountry(shippingCountry, cartCurrency)
      let payuAmount = totalAmount

      if (payuCurrency !== cartCurrency) {
        try {
          const converted = await convertMinorAmount(totalAmount, cartCurrency, payuCurrency)
          payuAmount = converted.amountMinor
        } catch {
          payuCurrency = cartCurrency
          payuAmount = totalAmount
        }
      }

      // Prepare products for PayU
      const products = cart.items?.map((item: any) => ({
        name: item.product_title || item.title || 'Product',
        unitPrice: String(Math.round(item.unit_price || 0)),
        quantity: String(item.quantity || 1),
      })) || []

      // Get customer IP (best effort)
      let customerIp = '127.0.0.1'
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json')
        const ipData = await ipRes.json()
        customerIp = ipData.ip || '127.0.0.1'
      } catch { /* use fallback */ }

      const continueUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/checkout?step=payment&payu=return&cartId=${cart.id}`
          : undefined

      // Create PayU order via frontend API route
      const payuRes = await fetch('/api/payu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartId: cart.id,
          totalAmount: String(payuAmount),
          currencyCode: payuCurrency,
          countryCode: shippingCountry,
          customerEmail: cart.email,
          customerFirstName: cart.billing_address?.first_name || '',
          customerLastName: cart.billing_address?.last_name || '',
          customerPhone: cart.billing_address?.phone || '',
          customerIp,
          products,
          continueUrl,
          description: `Order #${cart.id?.slice(-8)} - YOUR_PNI_USERNAMEtrafic.ro`,
        }),
      })

      const payuData = await payuRes.json()

      if (!payuData.success) {
        throw new Error(payuData.error || 'Error creating PayU payment')
      }

      if (payuData.flow === 'payu-india' && payuData.formAction && payuData.formFields) {
        if (typeof window !== 'undefined') {
          const form = document.createElement('form')
          form.method = 'POST'
          form.action = payuData.formAction

          Object.entries(payuData.formFields).forEach(([key, value]) => {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = key
            input.value = String(value ?? '')
            form.appendChild(input)
          })

          document.body.appendChild(form)
          form.submit()
        }
        return
      }

      // Store PayU order info for the return page
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('payuOrderId', payuData.orderId || '')
        window.localStorage.setItem('payuExtOrderId', payuData.extOrderId || '')
        window.localStorage.setItem('payuCartId', cart.id)
      }

      // Redirect to PayU payment page
      window.location.href = payuData.redirectUri
    } catch (err: any) {
      console.error('PayU payment error:', err)
      setErrorMessage(err.message || 'An error occurred processing the card payment. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayUPayment}
        size="large"
        data-testid={dataTestId || "submit-payu-button"}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg"
      >
        💳 Pay by card via PayU
      </Button>
      {submitting && (
        <p className="text-sm text-gray-500 text-center mt-2">
          You will be redirected to the secure PayU page...
        </p>
      )}
      <ErrorMessage
        error={errorMessage}
        data-testid="payu-payment-error-message"
      />
    </>
  )
}
