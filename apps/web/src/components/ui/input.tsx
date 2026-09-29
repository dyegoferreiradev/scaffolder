import * as React from "react"
import { cn } from "cn"

function Input({
  className,
  type,
  label,
  error,
  id,
  name,
  ...props
}: React.ComponentProps<"input"> & {
  label?: string
  error?: string
}) {
  const inputId = id ?? (typeof name === "string" ? name : undefined)

  const input = (
    <input
      id={inputId}
      type={type}
      data-slot="input"
      aria-invalid={Boolean(error) || undefined}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
        error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
      )}
      name={name}
      {...props}
    />
  )

  if (!label && !error) {
    return input
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      {input}
      {error && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}

export { Input }
