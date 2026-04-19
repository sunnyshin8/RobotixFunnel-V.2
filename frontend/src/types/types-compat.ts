export namespace HttpTypes {
  export type StoreCartAddress = {
    first_name?: string | null
    last_name?: string | null
    address_1?: string | null
    address_2?: string | null
    company?: string | null
    city?: string | null
    province?: string | null
    postal_code?: string | null
    country_code?: string | null
    phone?: string | null
  }

  export type StoreCartShippingOption = {
    id: string
    name?: string
    amount?: number
    shipping_option_id?: string
    service_zone?: {
      fulfillment_set?: {
        type?: string
      }
    }
  }

  export type StorePaymentSession = {
    id: string
    provider_id: string
    status?: string
    amount?: number
    currency_code?: string
    data?: Record<string, any>
  }

  export type StorePaymentCollection = {
    id: string
    status?: string
    amount?: number
    currency_code?: string
    payment_sessions?: StorePaymentSession[]
  }

  export type StoreRegion = {
    id: string
    countries?: Array<{ iso_2: string }>
  }

  export type StoreCustomerAddress = {
    id: string
    first_name?: string | null
    last_name?: string | null
    company?: string | null
    address_1?: string | null
    address_2?: string | null
    city?: string | null
    province?: string | null
    postal_code?: string | null
    country_code?: string | null
    phone?: string | null
  }

  export type StoreCustomer = {
    id: string
    first_name?: string | null
    email?: string | null
    addresses: StoreCustomerAddress[]
  }

  export type StoreProductVariant = {
    id: string
    title?: string
    sku?: string
    barcode?: string
    product_id?: string
    inventory_quantity?: number
    manage_inventory?: boolean
    allow_backorder?: boolean
    options?: Array<{ option_id: string; value: string }>
  }

  export type StoreProduct = {
    id: string
    title?: string
    handle?: string
    thumbnail?: string
    description?: string
    metadata?: Record<string, any> | null
    variants?: StoreProductVariant[]
  }

  export type StoreCartItem = {
    id: string
    title?: string
    product_title?: string
    thumbnail?: string
    quantity: number
    unit_price: number
    compare_at_unit_price?: number
    product_id?: string
    variant_id?: string
  }

  export type StoreCart = {
    id: string
    email?: string | null
    currency_code?: string | null
    item_subtotal?: number
    subtotal?: number
    shipping_total?: number
    tax_total?: number
    total?: number
    metadata?: Record<string, any>
    shipping_address?: StoreCartAddress | null
    billing_address?: StoreCartAddress | null
    shipping_methods?: StoreCartShippingOption[]
    payment_collection?: StorePaymentCollection | null
    region?: StoreRegion | null
    items?: StoreCartItem[]
    gift_cards?: any[]
  }
}
