import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "bg-gray-100 h-[50px] w-full rounded-base px-[17px] text-base transition-all",
        "placeholder:text-gray-500",
        "focus-visible:outline-none focus-visible:bg-gray-200/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
