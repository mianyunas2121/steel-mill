export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 px-4">
      <p className="text-sm font-semibold uppercase tracking-widest text-teal-700 mb-2">404</p>
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">Page not found</h1>
      <p className="text-slate-500 text-sm mb-6 text-center">
        This route does not exist in the Steel Mill Management System.
      </p>
      <a
        href="/login"
        className="inline-flex items-center px-4 py-2.5 rounded-md bg-teal-700 text-white text-sm font-medium hover:bg-teal-800"
      >
        Go to login
      </a>
    </div>
  );
}
