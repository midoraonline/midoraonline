import type { ReactNode } from "react";

/** API rejection message shown inside the section it belongs to. */
export function SectionAlert({ message }: { message: string | null }) {
  if (message === null) return null;
  return (
    <p className="text-xs font-medium text-[color:var(--error)]" role="alert">
      {message}
    </p>
  );
}

export function FieldError({ message }: { message?: string | null }) {
  return message ? <p className="text-xs text-[color:var(--error)]">{message}</p> : null;
}

export function SectionHeading({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="mt-0.5 text-sm text-muted">{children}</p>
    </div>
  );
}

/** Card for one form section; highlighted while it has errors. `serverMessage` renders at the top. */
export default function FormSection({
  invalid,
  serverMessage = null,
  className,
  children,
}: {
  invalid: boolean;
  serverMessage?: string | null;
  className?: string;
  children: ReactNode;
}) {
  const tone = invalid ? "border-[color:var(--error)] ring-1 ring-[color:var(--error)]/30" : "border-border";
  return (
    <section
      data-invalid={invalid}
      className={`scroll-mt-24 space-y-4 rounded-xl border bg-surface p-4 shadow-xs transition-colors sm:p-6 ${tone}${className ? ` ${className}` : ""}`}
    >
      <SectionAlert message={serverMessage} />
      {children}
    </section>
  );
}
