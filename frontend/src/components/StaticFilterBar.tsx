import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ChevronDown } from "lucide-react";

export function StaticFilterBar() {
  return (
    <div className="bg-white border-b border-gray-200 py-4 mb-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select defaultValue="prix">
              <SelectTrigger className="w-40">
                <SelectValue />
                <ChevronDown className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prix">Prix</SelectItem>
                <SelectItem value="nom">Nom</SelectItem>
                <SelectItem value="marque">Marque</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              Tous les prix
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <Select defaultValue="popularite">
              <SelectTrigger className="w-40">
                <SelectValue />
                <ChevronDown className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularite">Popularité</SelectItem>
                <SelectItem value="prix-asc">Prix croissant</SelectItem>
                <SelectItem value="prix-desc">Prix décroissant</SelectItem>
                <SelectItem value="nouveau">Nouveautés</SelectItem>
              </SelectContent>
            </Select>
            
            <span className="text-sm text-gray-600">Trier par</span>
          </div>
        </div>
      </div>
    </div>
  );
}