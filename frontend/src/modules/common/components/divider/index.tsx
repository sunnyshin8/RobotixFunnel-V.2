import { clx } from "@/components/ui"

type DividerProps = {
  className?: string
}

export default function Divider({ className }: DividerProps) {
  return <hr className={clx("border-0 border-t border-gray-200", className)} />
}
