export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-6">
      <h1 className="font-headline text-3xl tracking-tight text-text">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-1 text-sm text-text/70">{subtitle}</p>
      ) : null}
      <div className="mt-5 h-px w-full bg-divider" />
    </header>
  );
}
