"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@/types/types-compat"
import { Button } from "@/components/ui"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"

const CartDropdown = ({
  cart: cartState,
}: {
  cart?: HttpTypes.StoreCart | null
}) => {
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timer | undefined>(
    undefined
  )
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)
  const [liveCart, setLiveCart] = useState<HttpTypes.StoreCart | null | undefined>(cartState)

  // Sync with server-rendered cart prop
  useEffect(() => {
    setLiveCart(cartState)
  }, [cartState])

  // Listen for custom "cart-updated" events dispatched by addToCart etc.
  useEffect(() => {
    const refreshCart = () => {
      fetch('/api/cart')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.cart) {
            setLiveCart(data.cart)
          }
        })
        .catch(() => { })
    }

    window.addEventListener('cart-updated', refreshCart)
    window.addEventListener('focus', refreshCart)

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshCart()
      }
    }, 5000)

    return () => {
      window.removeEventListener('cart-updated', refreshCart)
      window.removeEventListener('focus', refreshCart)
      clearInterval(interval)
    }
  }, [])

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const totalItems =
    liveCart?.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  const subtotal = liveCart?.subtotal ?? 0

  const getCheckoutStep = (cart?: HttpTypes.StoreCart | null) => {
    if (!cart?.shipping_address?.address_1 || !cart?.email) {
      return "address"
    }

    if ((cart?.shipping_methods?.length ?? 0) === 0) {
      return "delivery"
    }

    return "payment"
  }

  const checkoutStep = getCheckoutStep(liveCart)
  const itemRef = useRef<number>(totalItems || 0)

  const timedOpen = () => {
    open()
    const timer = setTimeout(close, 5000)
    setActiveTimer(timer)
  }

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }
    open()
  }

  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()

  useEffect(() => {
    if (itemRef.current !== totalItems && !pathname.includes("/cart")) {
      timedOpen()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems, itemRef.current])

  return (
    <div
      className="h-full z-50"
      onMouseEnter={openAndCancel}
      onMouseLeave={close}
    >
      <Popover className="relative h-full">
        <PopoverButton
          className="h-full"
          suppressHydrationWarning
          aria-label={`Shopping Cart, ${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
        >
          <LocalizedClientLink
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:border-blue-300 text-gray-700 rounded-2xl transition-all duration-300 group relative overflow-hidden shadow-sm hover:shadow-md"
            href="/cart"
            data-testid="nav-cart-link"
            aria-label={`View shopping cart (${totalItems} ${totalItems === 1 ? 'item' : 'items'})`}
          >
            <svg className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="hidden small:inline font-bold uppercase tracking-widest text-[10px]">Cart</span>
            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full text-[10px] font-bold" aria-hidden="true">{totalItems}</span>
          </LocalizedClientLink>
        </PopoverButton>
        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverPanel
            static
            className="hidden small:block absolute top-[calc(100%+10px)] right-0 bg-white border border-gray-200 rounded-2xl w-[420px] text-gray-800 shadow-xl overflow-hidden"
            data-testid="nav-cart-dropdown"
            role="dialog"
            aria-label="Shopping Cart"
          >
            <div className="p-5 flex items-center justify-between border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800">Shopping Cart</h3>
              <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                {totalItems} ITEMS
              </span>
            </div>
            {liveCart && liveCart.items?.length ? (
              <>
                <ul className="overflow-y-scroll max-h-[402px] px-4 py-4 grid grid-cols-1 gap-y-4 no-scrollbar" aria-label="Items in Cart">
                  {liveCart.items
                    .sort((a, b) => {
                      return (a.created_at ?? "") > (b.created_at ?? "")
                        ? -1
                        : 1
                    })
                    .map((item) => (
                      <li
                        className="grid grid-cols-[80px_1fr] gap-x-4 bg-gray-50 border border-gray-100 rounded-2xl p-4 hover:bg-gray-100 hover:border-gray-200 transition-all duration-300 group/item"
                        key={item.id}
                        data-testid="cart-item"
                      >
                        <LocalizedClientLink
                          href={`/products/${item.product_handle}`}
                          className="w-20 aspect-square rounded-xl overflow-hidden border border-gray-200"
                          aria-label={`View details ${item.title}`}
                        >
                          <Thumbnail
                            thumbnail={item.thumbnail}
                            images={item.variant?.product?.images}
                            size="square"
                          />
                        </LocalizedClientLink>
                        <div className="flex flex-col justify-between flex-1">
                          <div className="flex flex-col flex-1">
                            <div className="flex items-start justify-between gap-x-2">
                              <div className="flex flex-col overflow-ellipsis whitespace-nowrap min-w-0">
                                <h4 className="text-sm font-bold text-gray-800 overflow-hidden text-ellipsis group-hover/item:text-blue-600 transition-colors duration-300">
                                  <LocalizedClientLink
                                    href={`/products/${item.product_handle}`}
                                    data-testid="product-link"
                                    className=""
                                  >
                                    {item.title}
                                  </LocalizedClientLink>
                                </h4>
                                <div className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mt-1">
                                  <LineItemOptions
                                    variant={item.variant}
                                    data-testid="cart-item-variant"
                                    data-value={item.variant}
                                  />
                                </div>
                                <span
                                  className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2"
                                  data-testid="cart-item-quantity"
                                  data-value={item.quantity}
                                >
                                  QTY: {item.quantity}
                                </span>
                              </div>
                              <div className="flex justify-end text-blue-600 font-bold text-sm">
                                <LineItemPrice
                                  item={item}
                                  style="tight"
                                  currencyCode={liveCart.currency_code}
                                />
                              </div>
                            </div>
                          </div>
                          <DeleteButton
                            id={item.id}
                            className="mt-3 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                            data-testid="cart-item-remove-button"
                            aria-label={`Remove ${item.title} from cart`}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Remove
                          </DeleteButton>
                        </div>
                      </li>
                    ))}
                </ul>
                <div className="p-6 border-t border-gray-100 flex flex-col gap-y-6 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                        Subtotal
                      </span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">Excluding VAT</span>
                    </div>
                    <span
                      className="text-2xl font-bold text-gray-800"
                      data-testid="cart-subtotal"
                      data-value={subtotal}
                    >
                      {convertToLocale({
                        amount: subtotal,
                        currency_code: liveCart.currency_code,
                      })}
                    </span>
                  </div>
                  <LocalizedClientLink href={`/checkout?step=${checkoutStep}`} passHref>
                    <button
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold uppercase tracking-wider text-xs rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
                      data-testid="go-to-cart-button"
                      aria-label="Proceed to checkout"
                    >
                      Secure Checkout
                    </button>
                  </LocalizedClientLink>
                </div>
              </>
            ) : (
              <div>
                <div className="flex py-16 flex-col gap-y-4 items-center justify-center">
                  <div className="bg-gray-100 text-gray-400 flex items-center justify-center w-12 h-12 rounded-full" aria-hidden="true">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="text-gray-500">Your cart is empty.</span>
                  <div>
                    <LocalizedClientLink href="/store">
                      <button
                        onClick={close}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                        aria-label="Explore all products in our store"
                      >
                        Explore Products
                      </button>
                    </LocalizedClientLink>
                  </div>
                </div>
              </div>
            )}
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

export default CartDropdown
