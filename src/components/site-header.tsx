import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Vote, LogOut, LogIn, User } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/chat", label: "Ask AI" },
  { to: "/guide", label: "Guide" },
  { to: "/myth", label: "Myth Buster" },
  { to: "/quiz", label: "Quiz" },
  { to: "/improve", label: "Polish Prompt" },
] as const;

export function SiteHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/75 border-b border-border/60">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: -8, scale: 1.05 }}
            className="size-9 rounded-xl gradient-primary grid place-items-center shadow-elegant"
          >
            <Vote className="size-5 text-primary-foreground" />
          </motion.div>
          <div className="leading-tight">
            <div className="font-semibold text-ink text-base">VoteSmart AI</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">India · Election Companion</div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`relative px-3 py-2 text-sm rounded-md transition-colors ${
                  active ? "text-ink" : "text-muted-foreground hover:text-ink"
                }`}
              >
                {n.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute left-2 right-2 -bottom-0.5 h-0.5 rounded-full gradient-primary"
                  />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          {!loading && user ? (
            <>
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-ink max-w-[160px] truncate"
              >
                <User className="size-3.5" />
                {user.email}
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="size-4" /> Sign out
              </Button>
            </>
          ) : !loading ? (
            <Button asChild size="sm" className="gradient-primary text-primary-foreground">
              <Link to="/auth">
                <LogIn className="size-4" /> Sign in
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
      {/* Mobile nav */}
      <div className="md:hidden border-t border-border/60 overflow-x-auto">
        <div className="flex gap-1 px-3 py-2 min-w-max">
          {NAV.map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                  active
                    ? "bg-ink text-primary-foreground"
                    : "text-muted-foreground bg-muted hover:text-ink"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
          {!loading && user ? (
            <>
              <Link
                to="/profile"
                className="px-3 py-1.5 text-xs rounded-full whitespace-nowrap text-muted-foreground bg-muted"
              >
                Profile
              </Link>
              <button
                onClick={signOut}
                className="px-3 py-1.5 text-xs rounded-full whitespace-nowrap bg-ink text-primary-foreground"
              >
                Sign out
              </button>
            </>
          ) : !loading ? (
            <Link
              to="/auth"
              className="px-3 py-1.5 text-xs rounded-full whitespace-nowrap bg-ink text-primary-foreground"
            >
              Sign in
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-muted-foreground flex flex-col md:flex-row gap-2 items-center justify-between">
        <p>© {new Date().getFullYear()} VoteSmart AI · Built for informed Indian voters.</p>
        <p className="opacity-70">Educational content only · Verify with eci.gov.in</p>
      </div>
    </footer>
  );
}