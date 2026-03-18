import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard, Users, UserCircle, Package, Calendar, DollarSign,
    LogOut, Calculator, FileText, ArrowDownCircle, ArrowUpCircle, Image,
    CheckSquare, Target, Shield, TrendingUp, LucideIcon, Menu, X,
    ChevronLeft, ChevronRight, Eye, EyeOff, Moon, Sun,
} from "lucide-react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "./ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.jpg";
import { NotificationPopover } from "@/features/notifications/components/NotificationPopover";
import { useAuth, AppPermission } from "@/hooks/useAuth";
import { useDueDateNotifier } from "@/hooks/useDueDateNotifier";
import { useNativeNotifications } from "@/hooks/useNativeNotifications";
import { useHideValues } from "@/hooks/useHideValues";
import { useTheme } from "@/hooks/useTheme";
import { GlobalSearch } from "./GlobalSearch";

interface LayoutProps {
    children: ReactNode;
}

interface NavItem {
    to: string;
    icon: LucideIcon;
    label: string;
    permission: AppPermission;
}

const navItems: NavItem[] = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", permission: "dashboard" },
    { to: "/leads", icon: Target, label: "Leads", permission: "leads" },
    { to: "/tasks", icon: CheckSquare, label: "Tarefas", permission: "tasks" },
    { to: "/produtividade", icon: TrendingUp, label: "Produtividade", permission: "produtividade" },
    { to: "/atendimentos", icon: Users, label: "Atendimentos", permission: "atendimentos" },
    { to: "/clientes", icon: UserCircle, label: "Clientes", permission: "clientes" },
    { to: "/produtos", icon: Package, label: "Produtos", permission: "produtos" },
    { to: "/contas-pagar", icon: ArrowDownCircle, label: "Contas a Pagar", permission: "contas_pagar" },
    { to: "/contas-receber", icon: ArrowUpCircle, label: "Contas a Receber", permission: "contas_receber" },
    { to: "/financeiro", icon: DollarSign, label: "Financeiro", permission: "financeiro" },
    { to: "/simulador", icon: Calculator, label: "Simulador", permission: "simulador" },
    { to: "/agenda", icon: Calendar, label: "Agenda", permission: "agenda" },
    { to: "/relatorios", icon: FileText, label: "Relatórios", permission: "relatorios" },
    { to: "/banners", icon: Image, label: "Banners", permission: "banners" },
];

const SIDEBAR_KEY = "afg-sidebar-collapsed";

export function Layout({ children }: LayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const { hasPermission, isAdmin, profile } = useAuth();
    useDueDateNotifier();
    useNativeNotifications();
    const { hidden, toggle: toggleValues } = useHideValues();
    const { theme, toggle: toggleTheme } = useTheme();

    const [collapsed, setCollapsed] = useState(() => {
        try { return localStorage.getItem(SIDEBAR_KEY) === "true"; } catch { return false; }
    });
    const [mobileOpen, setMobileOpen] = useState(false);

    // Save preference
    useEffect(() => {
        try { localStorage.setItem(SIDEBAR_KEY, String(collapsed)); } catch { /* noop */ }
    }, [collapsed]);

    // Close mobile drawer on navigation
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast({ title: "Erro ao sair", description: error.message, variant: "destructive" });
        } else {
            navigate("/auth");
        }
    };

    const visibleItems = navItems.filter((item) => hasPermission(item.permission));
    const sidebarWidth = collapsed ? "w-[68px]" : "w-64";
    const contentMargin = collapsed ? "lg:ml-[68px]" : "lg:ml-64";

    return (
        <div className="min-h-screen bg-background">
            {/* ── Mobile overlay ── */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* ── Sidebar ── */}
            <aside
                className={`
                    fixed top-0 left-0 z-50 h-screen border-r border-border bg-card
                    transition-all duration-300 ease-in-out
                    ${sidebarWidth}
                    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
                    lg:translate-x-0
                `}
            >
                {/* Logo area */}
                <div className={`flex h-16 items-center border-b border-border ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}>
                    {!collapsed && (
                        <img src={logo} alt="AFG" className="h-10 w-auto object-contain" />
                    )}
                    {collapsed && (
                        <img src={logo} alt="AFG" className="h-8 w-8 rounded object-cover" />
                    )}
                    {/* Close button on mobile */}
                    <button
                        className="lg:hidden p-1 rounded hover:bg-muted"
                        onClick={() => setMobileOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Nav items */}
                <nav className="flex-1 overflow-y-auto p-2 space-y-1" style={{ height: "calc(100% - 4rem - 7rem)" }}>
                    <TooltipProvider delayDuration={0}>
                        {visibleItems.map((item) => {
                            const isActive = location.pathname === item.to;
                            const link = (
                                <button
                                    key={item.to}
                                    onClick={() => navigate(item.to)}
                                    className={`
                                        w-full flex items-center gap-3 rounded-lg px-3 py-2.5
                                        text-sm font-medium transition-colors
                                        ${isActive
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }
                                        ${collapsed ? "justify-center px-2" : ""}
                                    `}
                                >
                                    <item.icon className={`shrink-0 ${collapsed ? "h-5 w-5" : "h-4 w-4"}`} />
                                    {!collapsed && <span className="truncate">{item.label}</span>}
                                </button>
                            );

                            if (collapsed) {
                                return (
                                    <Tooltip key={item.to}>
                                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                                        <TooltipContent side="right" sideOffset={8}>
                                            {item.label}
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            }
                            return link;
                        })}

                        {isAdmin && (
                            <>
                                <div className="my-2 border-t border-border" />
                                {(() => {
                                    const isActive = location.pathname === "/admin";
                                    const adminLink = (
                                        <button
                                            onClick={() => navigate("/admin")}
                                            className={`
                                                w-full flex items-center gap-3 rounded-lg px-3 py-2.5
                                                text-sm font-medium transition-colors
                                                ${isActive
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                }
                                                ${collapsed ? "justify-center px-2" : ""}
                                            `}
                                        >
                                            <Shield className={`shrink-0 ${collapsed ? "h-5 w-5" : "h-4 w-4"}`} />
                                            {!collapsed && <span>Administração</span>}
                                        </button>
                                    );

                                    if (collapsed) {
                                        return (
                                            <Tooltip>
                                                <TooltipTrigger asChild>{adminLink}</TooltipTrigger>
                                                <TooltipContent side="right" sideOffset={8}>
                                                    Administração
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    }
                                    return adminLink;
                                })()}
                                {(() => {
                                    const isActive = location.pathname === "/admin/logs";
                                    const logsLink = (
                                        <button
                                            onClick={() => navigate("/admin/logs")}
                                            className={`
                                                w-full flex items-center gap-3 rounded-lg px-3 py-2.5
                                                text-sm font-medium transition-colors
                                                ${isActive
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                }
                                                ${collapsed ? "justify-center px-2" : ""}
                                            `}
                                        >
                                            <FileText className={`shrink-0 ${collapsed ? "h-5 w-5" : "h-4 w-4"}`} />
                                            {!collapsed && <span>Logs</span>}
                                        </button>
                                    );

                                    if (collapsed) {
                                        return (
                                            <Tooltip>
                                                <TooltipTrigger asChild>{logsLink}</TooltipTrigger>
                                                <TooltipContent side="right" sideOffset={8}>
                                                    Logs de Auditoria
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    }
                                    return logsLink;
                                })()}
                            </>
                        )}
                    </TooltipProvider>
                </nav>

                {/* Bottom area */}
                <div className="border-t border-border p-2 space-y-1">
                    {/* Toggle button - desktop only */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden lg:flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors justify-center"
                    >
                        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        {!collapsed && <span className="truncate">Recolher menu</span>}
                    </button>

                    {/* Logout */}
                    {(() => {
                        const logoutBtn = (
                            <button
                                onClick={handleLogout}
                                className={`
                                    w-full flex items-center gap-3 rounded-lg px-3 py-2.5
                                    text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors
                                    ${collapsed ? "justify-center px-2" : ""}
                                `}
                            >
                                <LogOut className={`shrink-0 ${collapsed ? "h-5 w-5" : "h-4 w-4"}`} />
                                {!collapsed && <span>Sair</span>}
                            </button>
                        );

                        if (collapsed) {
                            return (
                                <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>{logoutBtn}</TooltipTrigger>
                                        <TooltipContent side="right" sideOffset={8}>
                                            Sair
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        }
                        return logoutBtn;
                    })()}
                </div>
            </aside>

            {/* ── Main content ── */}
            <div className={`transition-all duration-300 ${contentMargin}`}>
                {/* Topbar */}
                <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
                    {/* Left: hamburger (mobile) + breadcrumb */}
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setMobileOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <img src={logo} alt="AFG" className="h-8 w-auto object-contain lg:hidden" />
                    </div>

                    {/* Center: search */}
                    <div className="hidden sm:flex flex-1 justify-center px-4">
                        <GlobalSearch />
                    </div>

                    {/* Right: notifications + user */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            title={theme === "dark" ? "Modo claro" : "Modo escuro"}
                        >
                            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleValues}
                            title={hidden ? "Mostrar valores" : "Ocultar valores"}
                        >
                            {hidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </Button>
                        <NotificationPopover />
                        {profile && (
                            <div className="hidden sm:flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                    {profile.nome?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                                <span className="text-sm font-medium truncate max-w-[120px]">{profile.nome}</span>
                            </div>
                        )}
                    </div>
                </header>

                {/* Page content */}
                <div className="p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
