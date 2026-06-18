import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import { btnGhost } from "../ui/styles";

interface AppHeaderProps {
  backTo?: { label: string; href: string };
  title?: string;
  actions?: React.ReactNode;
}

export function AppHeader({ backTo, title, actions }: AppHeaderProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="border-b border-gray-800 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <Link to="/" className="text-xl font-bold text-white hover:text-gray-200 transition-colors shrink-0">
          SODA KANBA
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/profile" className="text-sm text-gray-400 hidden sm:inline hover:text-white transition-colors">
            {user?.name}
          </Link>
          <Link to="/profile" className={`${btnGhost} text-blue-400 hover:text-blue-300`}>
            Profile
          </Link>
          <Link to="/settings" className={`${btnGhost} text-blue-400 hover:text-blue-300`}>
            Settings
          </Link>
        </div>
      </div>

      {(backTo || title || actions) && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-3">
          <div>
            {backTo && (
              <Link to={backTo.href} className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
                &larr; {backTo.label}
              </Link>
            )}
            {title && <h1 className={`text-xl font-bold text-white ${backTo ? "mt-1" : ""}`}>{title}</h1>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
    </header>
  );
}
