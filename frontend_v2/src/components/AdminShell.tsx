import { ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, LogOut } from "lucide-react";
import Logo from "./Logo";

interface AdminShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  headerActions?: ReactNode;
  /** Where the back arrow goes. Defaults to the admin landing page; pass
   * null to hide it (used on the landing page itself). */
  backTo?: string | null;
}

/**
 * Shared chrome for every admin._pages screen — brings them onto the same
 * off-white/navy/blue brand system as the rest of the site instead of the
 * old standalone dark/amber admin theme.
 */
export default function AdminShell({ title, subtitle, children, headerActions, backTo = "/admin" }: AdminShellProps) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-ink">
      <header className="sticky top-0 z-20 h-16 px-6 flex items-center justify-between bg-brand-bg/90 backdrop-blur-md border-b border-brand-border">
        <div className="flex items-center gap-4">
          {backTo && (
            <Link to={backTo} className="text-brand-muted hover:text-brand-ink" title="Back">
              <ArrowLeft size={18} />
            </Link>
          )}
          <Link to="/">
            <Logo size={26} />
          </Link>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm font-semibold text-brand-muted hover:text-brand-ink"
        >
          <LogOut size={16} /> Log out
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">{title}</h1>
            {subtitle && <p className="text-brand-muted text-sm mt-1">{subtitle}</p>}
          </div>
          {headerActions}
        </div>

        {children}
      </main>
    </div>
  );
}
