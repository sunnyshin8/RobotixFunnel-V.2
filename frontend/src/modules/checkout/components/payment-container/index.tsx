import { Radio } from "@headlessui/react"
import { clx } from "@/components/ui"

type PaymentInfoMap = Record<string, { title?: string }>

type BaseProps = {
  paymentProviderId: string
  selectedPaymentOptionId: string
  paymentInfoMap: PaymentInfoMap
}

type StripeProps = BaseProps & {
  setCardBrand?: (brand: string | null) => void
  setError?: (error: string | null) => void
  setCardComplete?: (value: boolean) => void
}

function PaymentCard({ paymentProviderId, selectedPaymentOptionId, paymentInfoMap }: BaseProps) {
  const title = paymentInfoMap[paymentProviderId]?.title || paymentProviderId

  return (
    <Radio
      value={paymentProviderId}
      className="flex items-start gap-x-3 p-4 bg-gray-100 border border-gray-200 rounded-xl mb-3 hover:border-blue-500 transition cursor-pointer"
    >
      {({ checked }: { checked: boolean }) => (
        <div className="flex items-start gap-3 w-full">
          <div
            className={clx(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
              checked ? "border-blue-500 bg-blue-600" : "border-gray-300"
            )}
          >
            {checked && <div className="w-2 h-2 bg-white rounded-full" />}
          </div>
          <div className="flex-1">
            <span className="text-gray-900 font-medium">{title}</span>
          </div>
        </div>
      )}
    </Radio>
  )
}

export function StripeCardContainer(props: StripeProps) {
  props.setCardBrand?.("card")
  props.setError?.(null)
  props.setCardComplete?.(true)
  return <PaymentCard {...props} />
}

export default function PaymentContainer(props: BaseProps) {
  return <PaymentCard {...props} />
}
