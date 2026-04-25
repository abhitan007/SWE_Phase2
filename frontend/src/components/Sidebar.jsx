import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ role, navItems }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || user?.userId?.charAt(0)?.toUpperCase() || 'U';
  const displayName = user?.name || user?.userId || 'User';

  return (
    <div className="w-56 bg-white min-h-full text-gray-700 flex flex-col border-r border-gray-200">
      {/* User profile section */}
      <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={displayName}
            className="w-9 h-9 rounded-full object-cover border border-indigo-100 flex-shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
            {initial}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-gray-900 font-semibold text-sm truncate">{displayName}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{role}</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item, index) => (
          item.disabled || !item.path ? (
            <div key={index} className="px-3 pt-3 pb-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.title.replace(/^— | —$/g, '')}</span>
            </div>
          ) : (
          <NavLink
            key={index}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-[13px] font-medium rounded-lg transition-all duration-150 ${
                isActive
                  ? 'bg-[#3498db]/10 text-[#2980b9] font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {item.title}
          </NavLink>
          )
        ))}
      </nav>
      
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-400 hover:text-[#e74c3c] hover:bg-red-50 rounded-lg transition-all duration-150 cursor-pointer"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
