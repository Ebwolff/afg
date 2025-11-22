import { Link, useLocation } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

export function NavLink({ to, icon: Icon, children }: NavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-[1.02]",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm"
          : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span>{children}</span>
    </Link>
  );
}
