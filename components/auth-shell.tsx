import type { ReactNode } from "react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  panelClassName?: string;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  panelClassName,
}: AuthShellProps) {
  return (
    <main className="auth-shell relative isolate flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_16%,transparent),transparent_60%),linear-gradient(90deg,rgba(255,255,255,0.82),rgba(255,255,255,0.1))]" />
      <div className="pointer-events-none absolute -right-20 bottom-8 h-56 w-56 rounded-full bg-[color-mix(in_srgb,var(--primary)_16%,white)] blur-3xl" />
      <section
        className={[
          "relative z-10 w-full max-w-md rounded-[2rem] border border-white/70 bg-white/88 p-8 shadow-[0_24px_80px_rgba(0,51,160,0.12)] backdrop-blur-xl",
          panelClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-8 flex flex-col gap-5">{children}</div>
        {footer ? <div className="mt-6">{footer}</div> : null}
      </section>
    </main>
  );
}
