import { Search, ShoppingCart, User } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export function StaticHeader() {
  return (
    <header className="bg-teal-700 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <span className="text-orange-400 text-2xl font-bold">SOMBA</span>
            <span className="text-xl">logo</span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Rechercher un produit..." 
                className="pl-10 bg-white text-gray-900 border-0 rounded-full"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <Button variant="ghost" className="text-white hover:text-orange-400">
              Accueil
            </Button>
            <Button variant="ghost" className="text-white hover:text-orange-400">
              Dashboard
            </Button>
            <Button variant="ghost" className="text-orange-400">
              Article
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:text-orange-400">
              <ShoppingCart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:text-orange-400">
              <User className="h-5 w-5" />
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}