import type { ReactNode } from "react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <p className="auth-kicker">{eyebrow}</p>
        <h1 className="auth-title">{title}</h1>
        <p className="auth-description">{description}</p>
        <div className="mt-8 flex flex-col gap-5">{children}</div>
        {footer ? <div className="mt-6">{footer}</div> : null}
      </section>
    </main>
  );
}
