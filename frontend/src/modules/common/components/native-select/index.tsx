import { ChevronsUpDown } from "lucide-react"
import { clx, Label } from "@/components/ui"
import {
  SelectHTMLAttributes,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

export type NativeSelectProps = {
  placeholder?: string
  label?: string
  required?: boolean
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
} & SelectHTMLAttributes<HTMLSelectElement>

const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  (
    { placeholder = "Select...", label, required, defaultValue, className, children, ...props },
    ref
  ) => {
    const innerRef = useRef<HTMLSelectElement>(null)
    const selectId = props.id ?? props.name ?? "select"

    useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
      ref,
      () => innerRef.current
    )

    return (
      <div className="flex flex-col w-full">
        {label && (
          <Label className="mb-1 txt-compact-small text-gray-600">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <div className="relative flex items-center w-full">
          <select
            id={selectId}
            ref={innerRef}
            defaultValue={defaultValue}
            {...props}
            className="appearance-none w-full h-12 px-4 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:bg-gray-200 transition-colors"
          >
            {placeholder && (
              <option disabled value="">
                {placeholder}
              </option>
            )}
            {children}
          </select>
          <span className="absolute right-4 inset-y-0 flex items-center pointer-events-none text-gray-500">
            <ChevronsUpDown size={20} />
          </span>
        </div>
      </div>
    )
  }
)

NativeSelect.displayName = "NativeSelect"

export default NativeSelect
