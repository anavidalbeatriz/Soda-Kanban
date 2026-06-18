interface PageShellProps {
  children: React.ReactNode;
  narrow?: boolean;
}

export function PageShell({ children, narrow }: PageShellProps) {
  return (
    <div className="min-h-screen bg-gray-950">
      <main className={`mx-auto p-4 md:p-6 ${narrow ? "max-w-lg" : "max-w-5xl"}`}>{children}</main>
    </div>
  );
}
