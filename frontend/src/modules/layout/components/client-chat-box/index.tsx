"use client"

import dynamic from "next/dynamic"

/**
 * Client-side wrapper for AiChatBox.
 * `ssr: false` is only valid inside a Client Component (not Server Components).
 * This wrapper allows us to safely use it from the root layout (Server Component)
 * while completely preventing SSR hydration mismatches caused by AiChatBox's
 * client-only state (isOpen, Date.now(), dynamic SVG switching).
 */
const AiChatBox = dynamic(
  () => import("@modules/layout/components/ai-chat-box"),
  { ssr: false }
)

export default function ClientChatBox() {
  return <AiChatBox />
}
