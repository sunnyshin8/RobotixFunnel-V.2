"use client"

import { loadStripe } from "@stripe/stripe-js"
import React from "react"
import StripeWrapper from "./stripe-wrapper"
import BasePaymentWrapper from "./base-wrapper"
import { HttpTypes } from "@/types/types-compat"
import { isStripeLike } from "@lib/constants"

type PaymentWrapperProps = {
  cart: HttpTypes.StoreCart
  children: React.ReactNode
}

const stripeKey =
  process.env.NEXT_PUBLIC_STRIPE_KEY ||
  process.env.NEXT_PUBLIC_STRIPE_KEY

const stripeAccountId = process.env.NEXT_PUBLIC_STRIPE_ACCOUNT_ID
const stripePromise = stripeKey
  ? loadStripe(
      stripeKey,
      stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
    )
  : null

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ cart, children }) => {
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  if (
    isStripeLike(paymentSession?.provider_id) &&
    paymentSession &&
    stripePromise
  ) {
    return (
      <StripeWrapper
        paymentSession={paymentSession}
        stripeKey={stripeKey}
        stripePromise={stripePromise}
      >
        {children}
      </StripeWrapper>
    )
  }

  if (paymentSession?.provider_id === "base-crypto") {
    return <BasePaymentWrapper cart={cart}>{children}</BasePaymentWrapper>
  }

  return <div>{children}</div>
}

export default PaymentWrapper
