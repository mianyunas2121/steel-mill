import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4">
      <p className="text-2xs font-semibold uppercase tracking-widest text-brand-600 mb-2">404</p>
      <h1 className="text-xl font-semibold text-ink mb-2 tracking-tight">Page not found</h1>
      <p className="text-ink-subtle text-sm mb-6 text-center max-w-sm">
        This route does not exist in the Steel Mill Management System.
      </p>
      <Link href="/login" className="btn-primary">
        Go to login
      </Link>
    </div>
  );
}
