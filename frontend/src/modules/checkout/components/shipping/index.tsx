"use client"

import { Radio, RadioGroup } from "@headlessui/react"
import { setShippingMethod, updateCart } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import { convertToLocale } from "@lib/util/money"
import { CheckCircle2, Loader2 } from "lucide-react"
import { HttpTypes } from "@/types/types-compat"
import { Button, clx, Heading, Text } from "@/components/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import Divider from "@modules/common/components/divider"
import UiRadio from "@modules/common/components/radio"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

// Default shipping rate (fallback if admin API unreachable)
let FIXED_SHIPPING_RATE = 3000 // in cents (30.00 RON)

// Available couriers in Romania
const AVAILABLE_COURIERS = [
  { id: 'fan-courier', name: 'FAN Courier', icon: '📦', eta: '1-2 business days', active: true },
  { id: 'sameday', name: 'Sameday', icon: '⚡', eta: 'Same day or 24h delivery', active: true },
  { id: 'cargus', name: 'Urgent Cargus', icon: '🚚', eta: '1-2 business days', active: true },
  { id: 'gls', name: 'GLS Romania', icon: '📬', eta: '2-3 business days', active: true },
  { id: 'dpd', name: 'DPD Romania', icon: '🔴', eta: '1-3 business days', active: true },
]

const PICKUP_OPTION_ON = "__PICKUP_ON"
const PICKUP_OPTION_OFF = "__PICKUP_OFF"

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

function formatAddress(address: HttpTypes.StoreCartAddress) {
  if (!address) {
    return ""
  }

  let ret = ""

  if (address.address_1) {
    ret += ` ${address.address_1}`
  }

  if (address.address_2) {
    ret += `, ${address.address_2}`
  }

  if (address.postal_code) {
    ret += `, ${address.postal_code} ${address.city}`
  }

  if (address.country_code) {
    ret += `, ${address.country_code.toUpperCase()}`
  }

  return ret
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)
  const [selectedCourier, setSelectedCourier] = useState<string | null>(
    AVAILABLE_COURIERS[0].id
  )
  const [shippingRate, setShippingRate] = useState(30)
  const [shippingRateCents, setShippingRateCents] = useState(3000)
  const [pickupEnabled, setPickupEnabled] = useState(true)
  const [pickupAddress, setPickupAddress] = useState('Calea Unirii nr 35, Suceava')

  // Fetch shipping config from admin API
  useEffect(() => {
    fetch('/app/api/settings/shipping?public=1')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.settings) {
          const rate = data.settings.fixedShippingRate || 30
          setShippingRate(rate)
          setShippingRateCents(Math.round(rate * 100))
          FIXED_SHIPPING_RATE = Math.round(rate * 100)
          setPickupEnabled(data.settings.pickupEnabled !== false)
          if (data.settings.pickupAddress) setPickupAddress(data.settings.pickupAddress)
        }
      })
      .catch(() => { })
  }, [])

  const [showPickupOptions, setShowPickupOptions] =
    useState<string>(PICKUP_OPTION_OFF)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, number>
  >({})
  const [error, setError] = useState<string | null>(null)
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "delivery"

  const _shippingMethods = availableShippingMethods?.filter(
    (sm) => sm.service_zone?.fulfillment_set?.type !== "pickup"
  )

  const _pickupMethods = availableShippingMethods?.filter(
    (sm) => sm.service_zone?.fulfillment_set?.type === "pickup"
  )

  const hasPickupOptions = !!_pickupMethods?.length
  // Use robotix shipping options - shows dynamic pricing (30 RON or free for orders > 600 RON)
  const hasShippingMethods = !!_shippingMethods?.length

  useEffect(() => {
    setIsLoadingPrices(true)

    if (_shippingMethods?.length) {
      const promises = _shippingMethods
        .filter((sm) => sm.price_type === "calculated")
        .map((sm) => calculatePriceForShippingOption(sm.id, cart.id))

      if (promises.length) {
        Promise.allSettled(promises).then((res) => {
          const pricesMap: Record<string, number> = {}
          res
            .filter((r) => r.status === "fulfilled")
            .forEach((p) => (pricesMap[p.value?.id || ""] = p.value?.amount!))

          setCalculatedPricesMap(pricesMap)
          setIsLoadingPrices(false)
        })
      }
    } else {
      setIsLoadingPrices(false)
    }

    if (_pickupMethods?.find((m) => m.id === shippingMethodId)) {
      setShowPickupOptions(PICKUP_OPTION_ON)
    }
  }, [availableShippingMethods])

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = async () => {
    // If using robotix shipping methods, check if one is selected
    if (hasShippingMethods && !cart.shipping_methods?.[0]) {
      setError("Select a shipping method")
      return
    }

    // For fixed rate couriers, use the default shipping option
    if (!hasShippingMethods && selectedCourier) {
      setIsLoading(true)
      try {
        // Select a real option id from backend data instead of hardcoded ids.
        const cartTotal = cart.item_total ?? cart.total ?? 0
        const preferFree = cartTotal >= 60000 || selectedCourier === 'pickup'

        const candidateOptions = availableShippingMethods ?? []
        const freeOption = candidateOptions.find((o) => (o.amount ?? 0) === 0)
        const paidOption = candidateOptions.find((o) => (o.amount ?? 0) > 0)
        const fallbackOption = candidateOptions[0]

        const defaultShippingOptionId = (
          preferFree ? freeOption?.id : paidOption?.id
        ) ?? fallbackOption?.id

        if (!defaultShippingOptionId) {
          throw new Error("No shipping options available for this cart")
        }

        await setShippingMethod({
          cartId: cart.id,
          shippingMethodId: defaultShippingOptionId
        })

        // Also save courier details to metadata for display
        const isFreeShipping = (cart.item_total ?? cart.total ?? 0) >= 60000
        const shippingCost = selectedCourier === 'pickup' || isFreeShipping ? 0 : 3000
        await updateCart({
          metadata: {
            courier: selectedCourier,
            courier_name: selectedCourier === 'pickup'
              ? 'Self Pickup'
              : AVAILABLE_COURIERS.find(c => c.id === selectedCourier)?.name || selectedCourier,
            shipping_cost: shippingCost,
            shipping_cost_formatted: selectedCourier === 'pickup' || isFreeShipping ? 'Free' : `${shippingRate.toFixed(2)} RON`
          }
        })
      } catch (err: any) {
        console.error('Shipping error:', err)
        setError(err.message || "Error saving shipping method")
        setIsLoading(false)
        return
      }
      setIsLoading(false)
    }

    router.push(pathname + "?step=payment", { scroll: false })
  }

  const handleSetShippingMethod = async (
    id: string,
    variant: "shipping" | "pickup"
  ) => {
    setError(null)

    if (variant === "pickup") {
      setShowPickupOptions(PICKUP_OPTION_ON)
    } else {
      setShowPickupOptions(PICKUP_OPTION_OFF)
    }

    let currentId: string | null = null
    setIsLoading(true)
    setShippingMethodId((prev) => {
      currentId = prev
      return id
    })

    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .catch((err) => {
        setShippingMethodId(currentId)
        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  // Handle fixed rate courier selection (when no robotix methods configured)
  const handleSelectCourier = (courierId: string) => {
    setSelectedCourier(courierId)
    setError(null)
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  // Get courier list for display
  const courierList = AVAILABLE_COURIERS.filter(c => c.active)
    .map(c => c.name).join(', ')

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-2xl font-bold text-gray-900 gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !hasShippingMethods && !selectedCourier,
            }
          )}
        >
          <span className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm">2</span>
          Shipping
          {!isOpen && (selectedCourier || (cart.shipping_methods?.length ?? 0) > 0) && (
            <CheckCircle2 className="text-accent-500" />
          )}
        </Heading>
        {!isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <Text>
              <button
                onClick={handleEdit}
                className="text-blue-600 hover:text-primary-300 font-medium"
                data-testid="edit-delivery-button"
              >
                Edit
              </button>
            </Text>
          )}
      </div>
      {isOpen ? (
        <>
          <div className="grid">
            <div className="flex flex-col">
              <span className="font-medium txt-medium text-gray-900">
                Shipping Method
              </span>
              <span className="mb-4 text-gray-500 txt-medium">
                Flat rate shipping: <span className="text-blue-600 font-semibold">{shippingRate} RON</span> for all products
              </span>
            </div>
            <div data-testid="delivery-options-container">
              <div className="pb-6 md:pt-0 pt-2">
                {/* If robotix has shipping methods configured, use them */}
                {hasShippingMethods ? (
                  <>
                    {hasPickupOptions && (
                      <RadioGroup
                        value={showPickupOptions}
                        onChange={(value) => {
                          const id = _pickupMethods.find(
                            (option) => !option.insufficient_inventory
                          )?.id

                          if (id) {
                            handleSetShippingMethod(id, "pickup")
                          }
                        }}
                      >
                        <Radio
                          value={PICKUP_OPTION_ON}
                          data-testid="delivery-option-radio"
                          className={clx(
                            "flex items-center justify-between text-small-regular cursor-pointer py-4 border rounded-xl px-6 mb-2 transition-all",
                            {
                              "border-blue-500 bg-blue-50":
                                showPickupOptions === PICKUP_OPTION_ON,
                              "border-gray-200 bg-gray-100 hover:border-gray-300":
                                showPickupOptions !== PICKUP_OPTION_ON,
                            }
                          )}
                        >
                          <div className="flex items-center gap-x-4">
                            <UiRadio
                              checked={showPickupOptions === PICKUP_OPTION_ON}
                            />
                            <span className="text-base-regular text-gray-900">
                              🏪 Store Pickup
                            </span>
                          </div>
                          <span className="justify-self-end text-accent-400 font-semibold">
                            Free
                          </span>
                        </Radio>
                      </RadioGroup>
                    )}
                    <RadioGroup
                      value={shippingMethodId}
                      onChange={(v) => {
                        if (v) {
                          return handleSetShippingMethod(v, "shipping")
                        }
                      }}
                    >
                      {_shippingMethods.map((option) => {
                        const isDisabled =
                          option.price_type === "calculated" &&
                          !isLoadingPrices &&
                          typeof calculatedPricesMap[option.id] !== "number"

                        return (
                          <Radio
                            key={option.id}
                            value={option.id}
                            data-testid="delivery-option-radio"
                            disabled={isDisabled}
                            className={clx(
                              "flex items-center justify-between text-small-regular cursor-pointer py-4 border rounded-xl px-6 mb-2 transition-all duration-200",
                              {
                                "border-blue-500 bg-blue-50":
                                  option.id === shippingMethodId,
                                "border-gray-200 bg-gray-100 hover:border-gray-300":
                                  option.id !== shippingMethodId,
                                "opacity-50 cursor-not-allowed":
                                  isDisabled,
                              }
                            )}
                          >
                            <div className="flex items-center gap-x-4">
                              <UiRadio
                                checked={option.id === shippingMethodId}
                              />
                              <span className="text-base-regular text-gray-900">
                                {option.name}
                              </span>
                            </div>
                            <span className="justify-self-end text-blue-600 font-semibold">
                              {option.price_type === "flat" || option.price_type === "flat_rate" ? (
                                convertToLocale({
                                  amount: option.amount!,
                                  currency_code: cart?.currency_code,
                                })
                              ) : calculatedPricesMap[option.id] ? (
                                convertToLocale({
                                  amount: calculatedPricesMap[option.id],
                                  currency_code: cart?.currency_code,
                                })
                              ) : isLoadingPrices ? (
                                <Loader2 />
                              ) : (
                                "-"
                              )}
                            </span>
                          </Radio>
                        )
                      })}
                    </RadioGroup>
                  </>
                ) : (
                  /* Fixed Rate Courier Selection - 30 RON */
                  <div className="space-y-3">
                    {/* Info Banner */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                      <p className="text-blue-600 text-sm flex items-center gap-2">
                        <span className="text-lg">🚚</span>
                        <span>
                          <strong>Flat rate shipping: {shippingRate} RON</strong> - We ship via: {courierList}
                        </span>
                      </p>
                    </div>

                    {/* Courier Selection */}
                    <RadioGroup value={selectedCourier} onChange={handleSelectCourier}>
                      {AVAILABLE_COURIERS.filter(c => c.active).map((courier) => (
                        <Radio
                          key={courier.id}
                          value={courier.id}
                          className={clx(
                            "flex items-center justify-between cursor-pointer py-4 border rounded-xl px-6 mb-2 transition-all duration-200",
                            {
                              "border-blue-500 bg-blue-50":
                                courier.id === selectedCourier,
                              "border-gray-200 bg-gray-100 hover:border-gray-300":
                                courier.id !== selectedCourier,
                            }
                          )}
                        >
                          <div className="flex items-center gap-x-4">
                            <UiRadio checked={courier.id === selectedCourier} />
                            <div className="flex flex-col">
                              <span className="text-base-regular text-gray-900 flex items-center gap-2">
                                <span>{courier.icon}</span>
                                {courier.name}
                              </span>
                              <span className="text-xs text-gray-500">{courier.eta}</span>
                            </div>
                          </div>
                          <span className="text-blue-600 font-semibold">
                            {shippingRate.toFixed(2)} RON
                          </span>
                        </Radio>
                      ))}
                    </RadioGroup>

                    {/* Pickup Option */}
                    <div
                      className={clx(
                        "flex items-center justify-between cursor-pointer py-4 border rounded-xl px-6 transition-all duration-200",
                        {
                          "border-accent-500 bg-accent-500/10": selectedCourier === 'pickup',
                          "border-gray-200 bg-gray-100 hover:border-gray-300": selectedCourier !== 'pickup',
                        }
                      )}
                      onClick={() => handleSelectCourier('pickup')}
                    >
                      <div className="flex items-center gap-x-4">
                        <UiRadio checked={selectedCourier === 'pickup'} />
                        <div className="flex flex-col">
                          <span className="text-base-regular text-gray-900 flex items-center gap-2">
                            <span>🏪</span>
                            Self pickup from warehouse
                          </span>
                          <span className="text-xs text-gray-500">{pickupAddress}</span>
                        </div>
                      </div>
                      <span className="text-accent-400 font-semibold">
                        Free
                      </span>
                    </div>

                    {/* Delivery Note Info */}
                    <div className="mt-4 p-3 bg-gray-100 border border-gray-200 rounded-lg">
                      <p className="text-gray-600 text-xs text-center mb-2">
                        ℹ️ The seller will choose the most suitable courier for fast delivery based on availability and your location.
                      </p>
                      <div className="mt-2">
                        <label className="text-gray-500 text-xs block mb-1">
                          Delivery notes (optional):
                        </label>
                        <textarea
                          className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                          placeholder="E.g.: Call before delivery, leave at gate, etc."
                          rows={2}
                          maxLength={200}
                          onChange={(e) => {
                            // Store delivery note in local state or metadata
                            const note = e.target.value
                            // This can be saved to cart metadata on submit
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pickup Locations (if robotix configured) */}
          {showPickupOptions === PICKUP_OPTION_ON && _pickupMethods && (
            <div className="grid">
              <div className="flex flex-col">
                <span className="font-medium txt-medium text-ui-fg-base">
                  Store
                </span>
                <span className="mb-4 text-ui-fg-muted txt-medium">
                  Choose a store near you
                </span>
              </div>
              <div data-testid="delivery-options-container">
                <div className="pb-8 md:pt-0 pt-2">
                  <RadioGroup
                    value={shippingMethodId}
                    onChange={(v) => {
                      if (v) {
                        return handleSetShippingMethod(v, "pickup")
                      }
                    }}
                  >
                    {_pickupMethods?.map((option) => {
                      return (
                        <Radio
                          key={option.id}
                          value={option.id}
                          disabled={option.insufficient_inventory}
                          data-testid="delivery-option-radio"
                          className={clx(
                            "flex items-center justify-between text-small-regular cursor-pointer py-4 border rounded-xl px-6 mb-2 transition-all",
                            {
                              "border-blue-500 bg-blue-50":
                                option.id === shippingMethodId,
                              "border-gray-200 bg-gray-100 hover:border-gray-300":
                                option.id !== shippingMethodId,
                              "opacity-50 cursor-not-allowed":
                                option.insufficient_inventory,
                            }
                          )}
                        >
                          <div className="flex items-start gap-x-4">
                            <UiRadio
                              checked={option.id === shippingMethodId}
                            />
                            <div className="flex flex-col">
                              <span className="text-base-regular text-gray-900">
                                {option.name}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatAddress(
                                  option.service_zone?.fulfillment_set?.location
                                    ?.address
                                )}
                              </span>
                            </div>
                          </div>
                          <span className="justify-self-end text-accent-400 font-semibold">
                            {convertToLocale({
                              amount: option.amount!,
                              currency_code: cart?.currency_code,
                            })}
                          </span>
                        </Radio>
                      )
                    })}
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          <div>
            <ErrorMessage
              error={error}
              data-testid="delivery-option-error-message"
            />
            <Button
              type="button"
              size="large"
              className="mt-4 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={hasShippingMethods && !cart.shipping_methods?.[0]}
              data-testid="submit-delivery-option-button"
            >
              Continue to Payment
            </Button>
          </div>
        </>
      ) : (
        <div>
          <div className="text-small-regular">
            {(selectedCourier || (cart.shipping_methods?.length ?? 0) > 0) && (
              <div className="flex flex-col w-full">
                <Text className="txt-medium-plus text-gray-900 font-semibold mb-1">
                  Shipping Method
                </Text>
                {hasShippingMethods ? (
                  <Text className="txt-medium text-gray-600">
                    {(cart.shipping_methods?.at(-1)?.name || 'Courier Delivery')}{" "}
                    <span className="text-blue-600">
                      {convertToLocale({
                        amount: (cart.shipping_methods?.at(-1)?.amount || 0),
                        currency_code: cart?.currency_code,
                      })}
                    </span>
                  </Text>
                ) : (
                  <Text className="txt-medium text-gray-600">
                    {selectedCourier === 'pickup' ? (
                      <>🏪 Self Pickup <span className="text-accent-400">Free</span></>
                    ) : (
                      <>
                        {AVAILABLE_COURIERS.find(c => c.id === selectedCourier)?.icon}{' '}
                        {AVAILABLE_COURIERS.find(c => c.id === selectedCourier)?.name}{' '}
                        <span className="text-blue-600">{shippingRate.toFixed(2)} RON</span>
                        <span className="text-gray-500 text-xs ml-2">
                          ({courierList})
                        </span>
                      </>
                    )}
                  </Text>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <Divider className="mt-8" />
    </div>
  )
}

export default Shipping
