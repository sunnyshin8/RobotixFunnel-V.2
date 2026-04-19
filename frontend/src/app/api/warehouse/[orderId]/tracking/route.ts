import { NextResponse } from "next/server"
import { getWarehouseURL } from "@lib/util/env"

const WAREHOUSE_URL = process.env.WAREHOUSE_ORCHESTRATOR_URL || getWarehouseURL()

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params

  try {
    const res = await fetch(`${WAREHOUSE_URL}/api/warehouse/order/${orderId}`, {
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: "Order not found in warehouse" },
        { status: 404 }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: "Warehouse service unavailable" },
      { status: 503 }
    )
  }
}
