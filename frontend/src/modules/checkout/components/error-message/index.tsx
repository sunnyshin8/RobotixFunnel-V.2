"use client"

type ErrorMessageProps = {
  error?: string | null
  "data-testid"?: string
}

export default function ErrorMessage({ error, "data-testid": dataTestId }: ErrorMessageProps) {
  if (!error) {
    return null
  }

  return (
    <p className="mt-2 text-sm text-red-600" data-testid={dataTestId}>
      {error}
    </p>
  )
}
