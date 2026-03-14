import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-5xl text-rose-400 mb-4">404</h1>
      <p className="text-rose-300 mb-6">This page doesn't exist yet in our story.</p>
      <Link
        to="/"
        className="px-6 py-3 bg-rose-400 text-white rounded-full hover:bg-rose-500 transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
