"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Rótulo + input + mensagem de erro, com acessibilidade (htmlFor, aria-invalid) já ligada. */
export function TextField({
  label,
  error,
  className,
  inputClassName,
  id,
  ...props
}: ComponentProps<typeof Input> & { label: ReactNode; error?: string; inputClassName?: string }) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={fieldId} className="block text-sm">
        {label}
      </Label>
      <Input id={fieldId} aria-invalid={!!error} className={inputClassName} {...props} />
      {error && <p className="text-xs font-medium text-rose-700">{error}</p>}
    </div>
  );
}
