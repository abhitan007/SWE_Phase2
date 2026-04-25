import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function getDashboardPath(role) {
  if (role === 'hmc_member') return '/hmc-dashboard';
  if (role) return `/${role}-dashboard`;
  return '/login';
}

export default function NotFound() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const home = getDashboardPath(user?.role);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <p className="text-[120px] leading-none font-black text-indigo-600">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Page not found</h1>
        <p className="text-gray-500 text-sm mt-3">
          The page you tried to open doesn't exist or has been moved. Check the URL or head back to your dashboard.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold cursor-pointer"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate(home)}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold cursor-pointer"
          >
            {user ? 'Go to Dashboard' : 'Go to Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
