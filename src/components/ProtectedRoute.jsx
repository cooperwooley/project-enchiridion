import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children, fallback }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-3 border-rose-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return fallback;

  return children;
}
