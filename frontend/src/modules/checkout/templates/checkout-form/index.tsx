import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { listRegions } from "@lib/data/regions"
import { HttpTypes } from "@/types/types-compat"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"
import CheckoutAuthPrompt from "@modules/checkout/components/checkout-auth"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")
  const regions = await listRegions()

  if (!shippingMethods || !paymentMethods || !regions) {
    return null
  }

  return (
    <div className="w-full grid grid-cols-1 gap-y-8">
      {/* Optional sign in for faster checkout; guest checkout remains available. */}
      {!customer && <CheckoutAuthPrompt />}

      <Addresses cart={cart} customer={customer} regions={regions} />

      <Shipping cart={cart} availableShippingMethods={shippingMethods} />

      <Payment cart={cart} availablePaymentMethods={paymentMethods} />

      <Review cart={cart} />
    </div>
  )
}
