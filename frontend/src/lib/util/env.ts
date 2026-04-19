export const getBaseURL = () => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim()

  if (baseUrl) {
    return baseUrl
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return "http://localhost:8000"
}

export const getWarehouseURL = () => {
  const warehouseUrl = process.env.NEXT_PUBLIC_WAREHOUSE_URL?.trim()

  if (warehouseUrl) {
    return warehouseUrl
  }

  return "http://localhost:4000"
}

export const getBackendURL = () => {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || process.env.BACKEND_URL?.trim()

  if (backendUrl) {
    return backendUrl
  }

  return "http://localhost:9000"
}
