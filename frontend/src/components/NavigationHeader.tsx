import React from 'react';
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, Store, Home, Package, Settings, LogOut, ShoppingBag, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { CartDrawer } from './CartDrawer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';

export function NavigationHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const { items } = useCart();

  // Debug logging
  console.log('🔍 NavigationHeader - User:', user);
  console.log('🔍 NavigationHeader - User avatar:', user?.avatar);
  console.log('🔍 NavigationHeader - User role:', user?.role);
  console.log('🔍 NavigationHeader - Is authenticated:', !!user);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Pour le moment, on redirige vers la page des articles avec la recherche
      navigate('/articles');
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm border-b border-somba-primary/10 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center">
            <button 
              onClick={() => handleNavigation('home')}
              className="text-2xl font-bold text-somba-primary hover:text-somba-accent transition-colors"
            >
              SOMBA
            </button>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Rechercher des produits, boutiques ou zones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border-somba-primary/20 focus:border-somba-accent focus:ring-somba-accent"
                />
                <Button 
                  type="submit"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-somba-accent hover:bg-somba-accent/90 px-4 py-1"
                  size="sm"
                >
                  Rechercher
                </Button>
              </div>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <CartDrawer
              onNavigateToRegister={() => handleNavigation('/register')}
              onNavigateToCheckout={() => handleNavigation('checkout')}
            >
              <Button variant="ghost" className="relative p-2 hover:bg-somba-light">
                <ShoppingCart className="h-6 w-6 text-somba-primary" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-somba-accent text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Button>
            </CartDrawer>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      {(() => {
                        const avatarUrl = user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${(import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '')}${user.avatar}`) : undefined;
                        console.log('🖼️ Avatar URL:', avatarUrl);
                        return <AvatarImage src={avatarUrl} alt={user.full_name} />;
                      })()}
                      <AvatarFallback className="bg-somba-accent text-white">
                        {getUserInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-somba-primary">{user.full_name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavigation('/dashboard')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Mon profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation('/dashboard')}>
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    <span>Mes Commandes</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation('/dashboard')}>
                    <Heart className="mr-2 h-4 w-4" />
                    <span>Mes Favoris</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation('/dashboard')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Paramètres</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-somba-primary hover:bg-somba-light"
                  >
                    Connexion
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    size="sm"
                    className="bg-somba-accent hover:bg-somba-accent/90"
                  >
                    Inscription
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-somba-primary" />
              ) : (
                <Menu className="h-6 w-6 text-somba-primary" />
              )}
            </Button>
          </div>
        </div>

        {/* Navigation Menu - Desktop */}
        <nav className="hidden md:flex items-center space-x-8 py-4 border-t border-somba-primary/10">
          <Link
            to="/"
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/'
                ? 'bg-somba-accent text-white'
                : 'text-somba-primary hover:bg-somba-light'
            }`}
          >
            <Home className="h-4 w-4" />
            <span>Accueil</span>
          </Link>

          <Link
            to="/stores"
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/stores'
                ? 'bg-somba-accent text-white'
                : 'text-somba-primary hover:bg-somba-light'
            }`}
          >
            <Store className="h-4 w-4" />
            <span>Boutiques</span>
          </Link>

          <Link
            to="/articles"
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/articles'
                ? 'bg-somba-accent text-white'
                : 'text-somba-primary hover:bg-somba-light'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Catalogue</span>
          </Link>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-somba-primary/10 bg-white">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-somba-primary/20"
                />
              </div>
            </form>

            {/* Mobile Navigation */}
            <nav className="space-y-2 mb-4">
              <Link
                to="/"
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors ${
                  location.pathname === '/'
                    ? 'bg-somba-accent text-white'
                    : 'text-somba-primary hover:bg-somba-light'
                }`}
              >
                <Home className="h-5 w-5" />
                <span>Accueil</span>
              </Link>

              <Link
                to="/stores"
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors ${
                  location.pathname === '/stores'
                    ? 'bg-somba-accent text-white'
                    : 'text-somba-primary hover:bg-somba-light'
                }`}
              >
                <Store className="h-5 w-5" />
                <span>Boutiques</span>
              </Link>

              <Link
                to="/articles"
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors ${
                  location.pathname === '/articles'
                    ? 'bg-somba-accent text-white'
                    : 'text-somba-primary hover:bg-somba-light'
                }`}
              >
                <Package className="h-5 w-5" />
                <span>Catalogue</span>
              </Link>
            </nav>

            {/* Mobile User Menu */}
            <div className="border-t border-somba-primary/10 pt-4">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center px-3 py-2 space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${(import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '')}${user.avatar}`) : undefined} alt={user.full_name} />
                      <AvatarFallback className="bg-somba-accent text-white text-sm">
                        {getUserInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium text-somba-primary">{user.full_name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  
                  {/* Mobile Profile Access */}
                  <Link
                    to="/dashboard"
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors text-somba-primary hover:bg-somba-light"
                  >
                    <User className="h-4 w-4" />
                    <span>Mon profil</span>
                  </Link>
                  
                  <Button 
                    onClick={handleLogout}
                    variant="outline" 
                    className="w-full border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
                  >
                    Déconnexion
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link to="/login" className="block">
                    <Button
                      variant="outline"
                      className="w-full border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
                    >
                      Connexion
                    </Button>
                  </Link>
                  <Link to="/register" className="block">
                    <Button
                      className="w-full bg-somba-accent hover:bg-somba-accent/90"
                    >
                      Inscription
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}