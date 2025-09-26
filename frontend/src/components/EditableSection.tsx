import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Edit3, Save, X } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import * as React from "react";


interface EditableSectionProps {
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
  isEditing?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
}

export function EditableSection({ 
  title, 
  children, 
  onEdit, 
  isEditing = false, 
  onSave, 
  onCancel 
}: EditableSectionProps) {
  return (
    <div className="relative group">
      {/* Edit Overlay */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isEditing ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={onEdit}
            className="bg-white shadow-lg hover:bg-gray-50"
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Modifier {title}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" onClick={onSave} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className={isEditing ? "ring-2 ring-blue-500 rounded-lg" : ""}>
        {children}
      </div>
    </div>
  );
}

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  isEditing: boolean;
  className?: string;
  multiline?: boolean;
}

export function EditableText({ 
  value, 
  onChange, 
  isEditing, 
  className = "",
  multiline = false 
}: EditableTextProps) {
  if (!isEditing) {
    return <span className={className}>{value}</span>;
  }

  if (multiline) {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${className} min-h-[100px]`}
      />
    );
  }

  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    />
  );
}