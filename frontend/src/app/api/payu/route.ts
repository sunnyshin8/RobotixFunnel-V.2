import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"

function getPayUIndiaConfig() {
  const testMode = (process.env.PAYU_TEST_MODE || "true") === "true"
  return {
    key: process.env.PAYU_KEY || process.env.PAYU_MERCHANT_POS_ID || "",
    salt: process.env.PAYU_SALT_32 || "",
    testMode,
    paymentUrl: testMode ? "https://test.payu.in/_payment" : "https://secure.payu.in/_payment",
  }
}

function makeHash(input: string) {
  return crypto.createHash("sha512").update(input).digest("hex")
}

export async function POST(request: NextRequest) {
  try {
    const config = getPayUIndiaConfig()

    if (!config.key || !config.salt) {
      return NextResponse.json(
        {
          error: "PayU India credentials missing. Set PAYU_KEY and PAYU_SALT_32 in frontend/.env.local",
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      cartId,
      totalAmount,
      customerEmail,
      customerFirstName,
      customerLastName,
      customerPhone,
      customerIp,
      products,
      description,
      continueUrl,
      notifyUrl,
      currencyCode,
      countryCode,
    } = body

    if (!cartId || !totalAmount || !customerEmail) {
      return NextResponse.json(
        { error: "Required fields missing: cartId, totalAmount, customerEmail" },
        { status: 400 }
      )
    }

    const txnid = `rf_${cartId}_${Date.now()}`.slice(0, 50)
    const amountMajor = (Number(totalAmount) / 100).toFixed(2)
    const firstname = (customerFirstName || "Customer").slice(0, 60)
    const email = String(customerEmail)
    const phone = (customerPhone || "9999999999").replace(/[^0-9]/g, "").slice(0, 15) || "9999999999"
    const productinfo = (description || `Order ${cartId}`).slice(0, 100)

    const successUrl = `${request.nextUrl.origin}/api/payu/callback?status=success`
    const failureUrl = `${request.nextUrl.origin}/api/payu/callback?status=failure`

    const udf1 = String(cartId)
    const udf2 = String(countryCode || "ro").toLowerCase()
    const udf3 = ""
    const udf4 = ""
    const udf5 = ""

    const hashString = `${config.key}|${txnid}|${amountMajor}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${config.salt}`
    const hash = makeHash(hashString)

    const formFields = {
      key: config.key,
      txnid,
      amount: amountMajor,
      productinfo,
      firstname,
      email,
      phone,
      surl: notifyUrl || successUrl,
      furl: continueUrl || failureUrl,
      service_provider: "payu_paisa",
      hash,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
    }

    return NextResponse.json({
      success: true,
      flow: "payu-india",
      formAction: config.paymentUrl,
      formFields,
      orderId: txnid,
      extOrderId: txnid,
      currencyCode: String(currencyCode || "INR").toUpperCase(),
    })
  } catch (error: any) {
    console.error("PayU create order error:", error)
    return NextResponse.json({ error: error.message || "Error creating PayU order" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: "PayU India flow uses callback redirect verification, not OAuth status polling",
    },
    { status: 400 }
  )
}
