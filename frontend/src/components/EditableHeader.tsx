import { useState } from "react";
import { Search, ShoppingCart, User } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { EditableText, EditableSection } from "./EditableSection";

interface HeaderData {
  logoMain: string;
  logoSub: string;
  searchPlaceholder: string;
  navItems: string[];
}

interface EditableHeaderProps {
  isEditMode: boolean;
}

export function EditableHeader({ isEditMode }: EditableHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [headerData, setHeaderData] = useState<HeaderData>({
    logoMain: "SOMBA",
    logoSub: "logo",
    searchPlaceholder: "Rechercher un produit...",
    navItems: ["Accueil", "Dashboard", "Article"]
  });

  const [editedData, setEditedData] = useState(headerData);

  const handleSave = () => {
    setHeaderData(editedData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedData(headerData);
    setIsEditing(false);
  };

  return (
    <EditableSection
      title="En-tête"
      isEditing={isEditing}
      onEdit={() => isEditMode && setIsEditing(true)}
      onSave={handleSave}
      onCancel={handleCancel}
    >
      <header className="bg-teal-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <span className="text-orange-400 text-2xl font-bold">
                <EditableText
                  value={isEditing ? editedData.logoMain : headerData.logoMain}
                  onChange={(value) => setEditedData({ ...editedData, logoMain: value })}
                  isEditing={isEditing}
                />
              </span>
              <span className="text-xl">
                <EditableText
                  value={isEditing ? editedData.logoSub : headerData.logoSub}
                  onChange={(value) => setEditedData({ ...editedData, logoSub: value })}
                  isEditing={isEditing}
                />
              </span>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  placeholder={isEditing ? editedData.searchPlaceholder : headerData.searchPlaceholder}
                  className="pl-10 bg-white text-gray-900 border-0 rounded-full"
                />
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-6">
              {headerData.navItems.map((item, index) => (
                <Button 
                  key={index}
                  variant="ghost" 
                  className={`text-white hover:text-orange-400 ${index === 2 ? 'text-orange-400' : ''}`}
                >
                  <EditableText
                    value={isEditing ? editedData.navItems[index] : item}
                    onChange={(value) => {
                      const newItems = [...editedData.navItems];
                      newItems[index] = value;
                      setEditedData({ ...editedData, navItems: newItems });
                    }}
                    isEditing={isEditing}
                  />
                </Button>
              ))}
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
    </EditableSection>
  );
}