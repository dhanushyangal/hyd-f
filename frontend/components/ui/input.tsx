import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none transition-colors placeholder:text-neutral-400 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
