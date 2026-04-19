"use client"

import { Radio, RadioGroup } from "@headlessui/react"
import { isStripeLike, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession, createPaymentCollection, createPaymentSession } from "@lib/data/cart"
import { CheckCircle2, CreditCard } from "lucide-react"
import { Button, Heading, Text, clx } from "@/components/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import Divider from "@modules/common/components/divider"
import { convertMinorAmount, formatAmount, getCurrencyForCountry } from "@lib/util/currency"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

// Bank details type from admin settings
interface BankDetails {
  bankName: string
  iban: string
  beneficiary: string
  bankDetails: string
  cui?: string
}

// Payment method from admin settings API
interface PaymentSetting {
  id: string
  name: string
  type: string
  logo: string
  fee: string
  bankName?: string
  iban?: string
  beneficiary?: string
  bankDetails?: string
  cui?: string
  feeFixed?: number
}

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [isConvertingCurrency, setIsConvertingCurrency] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  const providerIds = useMemo(
    () => new Set((availablePaymentMethods || []).map((method) => method.id)),
    [availablePaymentMethods]
  )

  const payuProviderIds = ["payu-card", "payu", "pp_payu", "pp_payu_card"]
  const baseProviderIds = ["base-crypto", "base", "pp_base", "pp_base_crypto"]

  const hasPayuProvider = payuProviderIds.some((id) => providerIds.has(id))
  const hasBaseProvider = baseProviderIds.some((id) => providerIds.has(id))
  const payuEnabledByConfig = process.env.NEXT_PUBLIC_ENABLE_PAYU_PAYMENT !== "false"
  const baseEnabledByConfig = process.env.NEXT_PUBLIC_ENABLE_BASE_PAYMENT === "true"

  const fixedShippingRate = 3000
  const freeShippingThreshold = 60000
  const itemSubtotal = cart?.item_subtotal ?? 0
  const shippingTotal = cart?.shipping_total ?? 0
  const qualifiesForFreeShipping = itemSubtotal >= freeShippingThreshold
  const effectiveShipping =
    shippingTotal && shippingTotal > 0
      ? shippingTotal
      : qualifiesForFreeShipping
        ? 0
        : fixedShippingRate

  const payableAmount = Math.max(0, Math.round((cart?.total ?? 0) - (shippingTotal ?? 0) + effectiveShipping))
  const payableCurrency = (cart?.currency_code || "RON").toUpperCase()
  const shippingCountryCode = (cart?.shipping_address?.country_code || "").toLowerCase()
  const payuTargetCurrency = getCurrencyForCountry(shippingCountryCode, payableCurrency)
  const [displayPayableAmount, setDisplayPayableAmount] = useState(payableAmount)
  const [displayPayableCurrency, setDisplayPayableCurrency] = useState(payuTargetCurrency)
  const formattedPayable = formatAmount(displayPayableAmount, displayPayableCurrency)

  // Methods are now derived from backend provider list + active session.
  const isCodActive = true
  const bankSetting: PaymentSetting | undefined = undefined
  const isBankActive = false
  const isCardActive = (availablePaymentMethods || []).some((paymentMethod) => isStripeLike(paymentMethod.id))
  const isPayuActive = payuEnabledByConfig || hasPayuProvider || selectedPaymentMethod === "payu-card"
  const isBaseActive = baseEnabledByConfig || hasBaseProvider || selectedPaymentMethod === "base-crypto"

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
    if (isStripeLike(method)) {
      await initiatePaymentSession(cart, {
        provider_id: method,
      })
    }
  }

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  // For manual payment methods (COD, bank-transfer), we consider payment "ready"
  // when a selection is made, even without a payment session
  const hasManualPayment =
    selectedPaymentMethod === "cod" ||
    selectedPaymentMethod === "bank-transfer" ||
    selectedPaymentMethod === "payu-card" ||
    selectedPaymentMethod === "base-crypto"

  // Check if shipping is configured (either via robotix shipping methods OR fixed-rate courier in metadata)
  const hasShipping = (cart?.shipping_methods?.length ?? 0) > 0 || !!cart?.metadata?.courier

  const paymentReady =
    (activeSession && hasShipping) ||
    paidByGiftcard ||
    (hasManualPayment && hasShipping)

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (selectedPaymentMethod === "payu-card") {
        let payuAmountMinor = payableAmount
        let payuCurrency = payuTargetCurrency

        if (payableCurrency !== payuTargetCurrency) {
          setIsConvertingCurrency(true)
          try {
            const converted = await convertMinorAmount(
              payableAmount,
              payableCurrency,
              payuTargetCurrency
            )
            payuAmountMinor = converted.amountMinor
            payuCurrency = payuTargetCurrency
          } catch (fxError) {
            // Fallback to cart currency if FX service is unavailable.
            payuAmountMinor = payableAmount
            payuCurrency = payableCurrency
          } finally {
            setIsConvertingCurrency(false)
          }
        }

        const products =
          cart.items?.map((item: any) => ({
            name: item.product_title || item.title || "Product",
            unitPrice: String(Math.round(item.unit_price || 0)),
            quantity: String(item.quantity || 1),
          })) || []

        const continueUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}/checkout?step=payment&payu=return&cartId=${cart.id}`
            : undefined

        const payuRes = await fetch("/api/payu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cartId: cart.id,
            totalAmount: String(payuAmountMinor),
            currencyCode: payuCurrency,
            customerEmail: cart.email,
            customerFirstName: cart.billing_address?.first_name || "",
            customerLastName: cart.billing_address?.last_name || "",
            customerPhone: cart.billing_address?.phone || "",
            products,
            continueUrl,
            description: `Order ${cart.id?.slice(-8) || "checkout"}`,
          }),
        })

        const payuData = await payuRes.json()

        if (!payuRes.ok || !payuData.success) {
          throw new Error(payuData.error || "Error creating PayU payment")
        }

        if (payuData.flow === "payu-india" && payuData.formAction && payuData.formFields) {
          if (typeof window !== "undefined") {
            const form = document.createElement("form")
            form.method = "POST"
            form.action = payuData.formAction

            Object.entries(payuData.formFields).forEach(([key, value]) => {
              const input = document.createElement("input")
              input.type = "hidden"
              input.name = key
              input.value = String(value ?? "")
              form.appendChild(input)
            })

            document.body.appendChild(form)
            form.submit()
          }
          setIsLoading(false)
          return
        }

        if (typeof window !== "undefined") {
          window.localStorage.setItem("payuOrderId", payuData.orderId || "")
          window.localStorage.setItem("payuExtOrderId", payuData.extOrderId || "")
          window.localStorage.setItem("payuCartId", cart.id)
          window.location.href = payuData.redirectUri
        }
        setIsLoading(false)
        return
      }

      // For manual payment methods (COD), ensure payment collection exists
      if (
        selectedPaymentMethod === "cod" ||
        selectedPaymentMethod === "bank-transfer" ||
        selectedPaymentMethod === "payu-card" ||
        selectedPaymentMethod === "base-crypto"
      ) {
        // Store selected payment for the review step
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(`selectedPaymentMethod_${cart.id}`, selectedPaymentMethod)
          // Backward compatibility for older consumers.
          window.localStorage.setItem('selectedPaymentMethod', selectedPaymentMethod)
        }
        try {
          // Step 1: Create payment collection if it doesn't exist
          let paymentCollectionId = cart.payment_collection?.id
          if (!paymentCollectionId) {
            const paymentCollection = await createPaymentCollection(cart.id)
            paymentCollectionId = paymentCollection?.id
          }

          // Step 2: Create payment session if payment collection exists and no active session
          if (paymentCollectionId && !activeSession) {
            const providerForSession =
              selectedPaymentMethod === "base-crypto"
                ? "base-crypto"
                : "pp_system_default"

            await createPaymentSession(paymentCollectionId, providerForSession)
          }
        } catch (sessionErr: any) {
          console.warn('Payment session creation warning:', sessionErr?.message || sessionErr)
          // Don't block - some edge cases may still work
        }

        setIsLoading(false)
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          { scroll: false }
        )
      }

      const shouldInputCard = isStripeLike(selectedPaymentMethod) && !activeSession
      const checkActiveSession = activeSession?.provider_id === selectedPaymentMethod

      if (!checkActiveSession) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          { scroll: false }
        )
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  useEffect(() => {
    let cancelled = false

    const syncDisplayAmount = async () => {
      if (payableCurrency === payuTargetCurrency) {
        setDisplayPayableAmount(payableAmount)
        setDisplayPayableCurrency(payuTargetCurrency)
        return
      }

      setIsConvertingCurrency(true)
      try {
        const converted = await convertMinorAmount(
          payableAmount,
          payableCurrency,
          payuTargetCurrency
        )

        if (!cancelled) {
          setDisplayPayableAmount(converted.amountMinor)
          setDisplayPayableCurrency(payuTargetCurrency)
        }
      } catch {
        if (!cancelled) {
          setDisplayPayableAmount(payableAmount)
          setDisplayPayableCurrency(payableCurrency)
        }
      } finally {
        if (!cancelled) {
          setIsConvertingCurrency(false)
        }
      }
    }

    syncDisplayAmount()

    return () => {
      cancelled = true
    }
  }, [payableAmount, payableCurrency, payuTargetCurrency])

  useEffect(() => {
    if (selectedPaymentMethod) {
      return
    }

    const firstAvailableStripe = (availablePaymentMethods || []).find((m) => isStripeLike(m.id))?.id
    const fallback =
      activeSession?.provider_id ||
      (hasPayuProvider ? "payu-card" : undefined) ||
      (hasBaseProvider ? "base-crypto" : undefined) ||
      firstAvailableStripe ||
      "cod"

    setSelectedPaymentMethod(fallback)
  }, [selectedPaymentMethod, availablePaymentMethods, activeSession?.provider_id, hasPayuProvider, hasBaseProvider])

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-2xl font-bold text-gray-900 gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          <span className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm">3</span>
          Payment
          {!isOpen && paymentReady && <CheckCircle2 className="text-accent-500" />}
        </Heading>
        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-blue-600 hover:text-primary-300 font-medium"
              data-testid="edit-payment-button"
            >
              Edit
            </button>
          </Text>
        )}
      </div>
      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {!paidByGiftcard && false ? (
            <>
              <RadioGroup
                value={selectedPaymentMethod}
                onChange={(value: string) => setPaymentMethod(value)}
              >
                {availablePaymentMethods.map((paymentMethod) => (
                  <div key={paymentMethod.id}>
                    {isStripeLike(paymentMethod.id) ? (
                      <StripeCardContainer
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                        paymentInfoMap={paymentInfoMap}
                        setCardBrand={setCardBrand}
                        setError={setError}
                        setCardComplete={setCardComplete}
                      />
                    ) : (
                      <PaymentContainer
                        paymentInfoMap={paymentInfoMap}
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                      />
                    )}
                  </div>
                ))}
              </RadioGroup>
            </>
          ) : !paidByGiftcard ? (
            <>
              <div className="mb-4">
                <p className="text-gray-600 text-sm mb-4">
                  Select your preferred payment method:
                </p>
                <RadioGroup
                  value={selectedPaymentMethod}
                  onChange={(value: string) => setSelectedPaymentMethod(value)}
                >
                  {isCodActive && (
                    <Radio
                      value="cod"
                      className="flex items-start gap-x-3 p-4 bg-gray-100 border border-gray-200 rounded-xl mb-3 hover:border-blue-500 transition cursor-pointer"
                    >
                      {({ checked }: { checked: boolean }) => (
                        <div className="flex items-start gap-3 w-full">
                          <div className={clx(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                            checked ? "border-blue-500 bg-blue-600" : "border-gray-300"
                          )}>
                            {checked && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-gray-900 font-medium">💵 Cash on Delivery</span>
                              <span className="px-2 py-0.5 bg-accent-500/20 text-accent-400 text-xs rounded-full">Recommended</span>
                            </div>
                            <p className="text-gray-600 text-sm">Pay cash when you receive your package</p>
                          </div>
                        </div>
                      )}
                    </Radio>
                  )}
                  {isBankActive && bankSetting && (
                    <Radio
                      value="bank-transfer"
                      className="flex items-start gap-x-3 p-4 bg-gray-100 border border-gray-200 rounded-xl mb-3 hover:border-blue-500 transition cursor-pointer"
                    >
                      {({ checked }: { checked: boolean }) => (
                        <div className="flex items-start gap-3 w-full">
                          <div className={clx(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                            checked ? "border-blue-500 bg-blue-600" : "border-gray-300"
                          )}>
                            {checked && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-gray-900 font-medium">🏦 Bank Transfer</span>
                            </div>
                            <p className="text-gray-600 text-sm">You'll receive bank details by email after placing the order</p>
                            <div className="mt-2 p-3 bg-gray-200/50 rounded-lg text-xs text-gray-600">
                              {bankSetting.iban && <p><strong className="text-gray-900">IBAN:</strong> {bankSetting.iban}</p>}
                              {bankSetting.beneficiary && <p><strong className="text-gray-900">Beneficiary:</strong> {bankSetting.beneficiary}</p>}
                              {bankSetting.bankName && <p><strong className="text-gray-900">Bank:</strong> {bankSetting.bankName}</p>}
                            </div>
                          </div>
                        </div>
                      )}
                    </Radio>
                  )}
                  {isPayuActive && (
                    <Radio
                      value="payu-card"
                      className="flex items-start gap-x-3 p-4 bg-gray-100 border border-gray-200 rounded-xl mb-3 hover:border-blue-500 transition cursor-pointer"
                    >
                      {({ checked }: { checked: boolean }) => (
                        <div className="flex items-start gap-3 w-full">
                          <div className={clx(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                            checked ? "border-blue-500 bg-blue-600" : "border-gray-300"
                          )}>
                            {checked && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-gray-900 font-medium">💳 Credit / Debit Card (PayU)</span>
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">Secure</span>
                            </div>
                            <p className="text-gray-600 text-sm">Pay securely using Visa, Mastercard, RuPay, and other supported cards via PayU.</p>
                            <p className="text-gray-700 text-sm mt-1">
                              Total payable: <span className="font-semibold text-blue-600">{formattedPayable}</span>
                            </p>
                            {isConvertingCurrency && (
                              <p className="text-xs text-gray-500 mt-1">Updating amount for delivery country currency...</p>
                            )}
                          </div>
                        </div>
                      )}
                    </Radio>
                  )}
                  {isBaseActive && (
                    <Radio
                      value="base-crypto"
                      className="flex items-start gap-x-3 p-4 bg-gray-100 border border-gray-200 rounded-xl mb-3 hover:border-blue-500 transition cursor-pointer"
                    >
                      {({ checked }: { checked: boolean }) => (
                        <div className="flex items-start gap-3 w-full">
                          <div className={clx(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                            checked ? "border-blue-500 bg-blue-600" : "border-gray-300"
                          )}>
                            {checked && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-gray-900 font-medium">🪙 Base Network (Crypto)</span>
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">Onchain</span>
                            </div>
                            <p className="text-gray-600 text-sm">Pay via Base and verify the transaction hash in checkout.</p>
                            <p className="text-gray-700 text-sm mt-1">
                              Total payable: <span className="font-semibold text-blue-600">{formattedPayable}</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </Radio>
                  )}
                  {!isPayuActive && !isCardActive && (
                    <Radio
                      value="card-online"
                      className="flex items-start gap-x-3 p-4 bg-gray-100 border border-gray-200 rounded-xl opacity-50 cursor-not-allowed"
                      disabled
                    >
                      {({ checked }: { checked: boolean }) => (
                        <div className="flex items-start gap-3 w-full">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center mt-0.5">
                            <div className="w-2 h-2 bg-gray-300 rounded-full" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-gray-500 font-medium">💳 Card Online</span>
                              <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-xs rounded-full">Coming soon</span>
                            </div>
                            <p className="text-gray-500 text-sm">Secure card payment (coming soon)</p>
                          </div>
                        </div>
                      )}
                    </Radio>
                  )}
                </RadioGroup>
              </div>
            </>
          ) : null}

          {paidByGiftcard && (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-gray-900 font-semibold mb-1">
                Payment Method
              </Text>
              <Text
                className="txt-medium text-gray-600"
                data-testid="payment-method-summary"
              >
                Gift Card
              </Text>
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />

          <Button
            type="button"
            size="large"
            className="mt-6 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={
              isConvertingCurrency ||
              (isStripeLike(selectedPaymentMethod) && !cardComplete) ||
              (!selectedPaymentMethod && !paidByGiftcard)
            }
            data-testid="submit-payment-button"
          >
            {!activeSession && isStripeLike(selectedPaymentMethod)
              ? "Enter card details"
              : selectedPaymentMethod === "payu-card"
                ? "Pay Now"
                : selectedPaymentMethod === "base-crypto"
                  ? "Continue to Base Payment"
                : "Continue to Review"}
          </Button>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady ? (
            <div className="flex items-start gap-x-1 w-full">
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-gray-900 font-semibold mb-1">
                  Payment Method
                </Text>
                <Text
                  className="txt-medium text-gray-600"
                  data-testid="payment-method-summary"
                >
                  {selectedPaymentMethod === "cod" ? "💵 Cash on Delivery" :
                    selectedPaymentMethod === "bank-transfer" ? "🏦 Bank Transfer" :
                      selectedPaymentMethod === "payu-card" ? "💳 Credit / Debit Card (PayU)" :
                        selectedPaymentMethod === "base-crypto" ? "🪙 Base Network (Crypto)" :
                        paymentInfoMap[activeSession?.provider_id]?.title || activeSession?.provider_id}
                </Text>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-gray-900 font-semibold mb-1">
                Payment Method
              </Text>
              <Text
                className="txt-medium text-gray-600"
                data-testid="payment-method-summary"
              >
                Gift Card
              </Text>
            </div>
          ) : null}
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
