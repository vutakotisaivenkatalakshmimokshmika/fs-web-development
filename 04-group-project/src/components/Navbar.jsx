import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../services/authService";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  return (
    <header className="border-b border-ink/10 bg-parchment/95 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-dashed border-gold flex items-center justify-center">
            <span className="font-display text-gold text-sm">V</span>
          </div>
          <div>
            <p className="font-display text-lg leading-none text-ink">Verifi</p>
            <p className="text-[11px] text-slate2 font-mono uppercase tracking-wider">Institutional Records</p>
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-ink leading-none">{user.name}</p>
              <p className="text-[11px] text-slate2 font-mono uppercase tracking-wider mt-1">
                {user.role} · {user.department}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 rounded border border-ink/15 text-ink hover:bg-ink hover:text-parchment transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
