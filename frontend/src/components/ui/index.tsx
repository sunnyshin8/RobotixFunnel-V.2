"use client"

import React, { useCallback, useState } from "react"

type ClassValue = string | false | null | undefined

type ClassDictionary = Record<string, boolean | undefined | null>

export function clx(...values: Array<ClassValue | ClassDictionary>) {
  const out: string[] = []

  values.forEach((value) => {
    if (!value) {
      return
    }

    if (typeof value === "string") {
      out.push(value)
      return
    }

    Object.entries(value).forEach(([key, enabled]) => {
      if (enabled) {
        out.push(key)
      }
    })
  })

  return out.join(" ")
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean
  size?: "small" | "medium" | "large"
}

export function Button({
  isLoading,
  size = "medium",
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const sizeClass =
    size === "large"
      ? "px-4 py-3 text-sm"
      : size === "small"
        ? "px-2 py-1 text-xs"
        : "px-3 py-2 text-sm"

  return (
    <button
      className={clx(
        "inline-flex items-center justify-center rounded-md font-medium transition",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        sizeClass,
        className
      )}
      disabled={Boolean(disabled || isLoading)}
      {...props}
    >
      {isLoading ? "Loading..." : children}
    </button>
  )
}

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  level?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

export function Heading({ level = "h2", children, ...props }: HeadingProps) {
  const Component = level
  return <Component {...props}>{children}</Component>
}

type TextProps = React.HTMLAttributes<HTMLParagraphElement>

export function Text({ children, ...props }: TextProps) {
  return <p {...props}>{children}</p>
}

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

export function Label({ children, ...props }: LabelProps) {
  return <label {...props}>{children}</label>
}

export function useToggleState(initial = false) {
  const [state, setState] = useState(initial)

  const open = useCallback(() => setState(true), [])
  const close = useCallback(() => setState(false), [])
  const toggle = useCallback(() => setState((s) => !s), [])

  return { state, open, close, toggle }
}
