import type { ReactNode } from "react";

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="my-4 rounded-lg border border-dashed border-border bg-muted p-6">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-2 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function ErrorState({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="my-4 rounded-lg border border-destructive bg-card p-4 text-sm text-destructive"
    >
      {children}
    </div>
  );
}
