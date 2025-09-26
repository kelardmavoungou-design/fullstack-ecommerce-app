import { useState } from "react";
import { EditableText, EditableSection } from "./EditableSection";

interface PageTitleData {
  title: string;
  subtitle: string;
}

interface EditablePageTitleProps {
  isEditMode: boolean;
}

export function EditablePageTitle({ isEditMode }: EditablePageTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [titleData, setTitleData] = useState<PageTitleData>({
    title: "Nos Produits",
    subtitle: "Découvrez notre sélection de produits de qualité"
  });

  const [editedData, setEditedData] = useState(titleData);

  const handleSave = () => {
    setTitleData(editedData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedData(titleData);
    setIsEditing(false);
  };

  return (
    <EditableSection
      title="Titre de page"
      isEditing={isEditing}
      onEdit={() => isEditMode && setIsEditing(true)}
      onSave={handleSave}
      onCancel={handleCancel}
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          <EditableText
            value={isEditing ? editedData.title : titleData.title}
            onChange={(value) => setEditedData({ ...editedData, title: value })}
            isEditing={isEditing}
          />
        </h1>
        <p className="text-gray-600">
          <EditableText
            value={isEditing ? editedData.subtitle : titleData.subtitle}
            onChange={(value) => setEditedData({ ...editedData, subtitle: value })}
            isEditing={isEditing}
          />
        </p>
      </div>
    </EditableSection>
  );
}