"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Estado vazio padrão: ícone, título, texto e uma ação opcional. */
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-3xl bg-[var(--surface)] p-10 text-center sm:p-14">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
        <Icon className="h-7 w-7" />
      </span>
      <h2 className="text-2xl font-black tracking-tight">{title}</h2>
      {children && <p className="max-w-sm text-sm text-muted-foreground">{children}</p>}
      {action}
    </div>
  );
}
