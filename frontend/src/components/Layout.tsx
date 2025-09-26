import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Truck, QrCode, Camera, LogOut, Settings } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Layout({
  children,
  activeTab,
  onTabChange,
}: LayoutProps) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const deliveryMenuItems = [
    { id: "delivery-dashboard", label: "Mes Livraisons", icon: Truck },
    { id: "delivery-scanner", label: "Scanner QR", icon: QrCode },
    { id: "camera-test", label: "Test Caméra", icon: Camera },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-800"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "delivery") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Accès restreint
          </h2>
          <p className="text-slate-600">Accès réservé aux livreurs</p>
        </div>
      </div>
    );
  }

  const menuItems = deliveryMenuItems;
  const roleInfo = {
    name: "Livreur",
    badge: "Delivery",
    initials: "LV",
    color: "#FF6600",
    userName: user?.name || "Jean Livreur",
  } as const;

  const handleMenuItemClick = (itemId: string) => {
    onTabChange(itemId);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-6 h-16 flex items-center justify-between shadow-sm sticky top-0 z-40">
        {/* Logo + badge */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-teal-700 to-teal-900 shadow-sm">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <h1 className="text-xl font-bold text-teal-800 tracking-tight">
              SOMBANGO
            </h1>
            <span
              className="text-xs px-3 py-1 rounded-full text-white font-medium shadow-sm hidden sm:inline-block"
              style={{ backgroundColor: roleInfo.color }}
            >
              {roleInfo.badge}
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  className={`gap-2 font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-orange-500 text-white hover:bg-orange-600 shadow-sm"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                  onClick={() => handleMenuItemClick(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </nav>
        </div>

        {/* Profil utilisateur avec menu déroulant */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:shadow-sm transition-all">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="bg-orange-100 text-orange-800 font-semibold text-xs">
                  {roleInfo.initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline font-medium text-slate-700 text-sm">
                {roleInfo.userName}
              </span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-48" align="end">
            <DropdownMenuLabel>
              Connecté en tant que <br />
              <span className="font-semibold">{roleInfo.userName}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Contenu principal */}
      <main className="p-6 bg-slate-50 min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
