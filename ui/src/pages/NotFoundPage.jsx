import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
      <div className="max-w-md text-center">
        <div className="text-2xl font-semibold text-slate-900">Page not found</div>
        <div className="mt-2 text-sm text-slate-600">That route doesn’t exist.</div>
        <div className="mt-6">
          <Link
            className="inline-flex items-center rounded-md bg-slate-900 text-white px-3 py-2 text-sm hover:bg-slate-800"
            to="/dashboard"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
