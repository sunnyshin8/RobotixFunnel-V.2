import { NextRequest, NextResponse } from "next/server"

function redirectToCheckout(request: NextRequest, payload: Record<string, string>) {
  const countryCode = payload.udf2 || "ro"
  const cartId = payload.udf1 || ""
  const status = (payload.status || "").toLowerCase()
  const txnid = payload.txnid || ""
  const mihpayid = payload.mihpayid || ""

  const url = new URL(`/${countryCode}/checkout/payu-return`, request.nextUrl.origin)
  if (cartId) url.searchParams.set("cartId", cartId)
  if (status) url.searchParams.set("payuStatus", status)
  if (txnid) url.searchParams.set("txnid", txnid)
  if (mihpayid) url.searchParams.set("mihpayid", mihpayid)

  return NextResponse.redirect(url.toString(), 302)
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const payload: Record<string, string> = {}

  for (const [key, value] of formData.entries()) {
    payload[key] = String(value)
  }

  return redirectToCheckout(request, payload)
}

export async function GET(request: NextRequest) {
  const payload: Record<string, string> = {}
  request.nextUrl.searchParams.forEach((value, key) => {
    payload[key] = value
  })

  return redirectToCheckout(request, payload)
}
