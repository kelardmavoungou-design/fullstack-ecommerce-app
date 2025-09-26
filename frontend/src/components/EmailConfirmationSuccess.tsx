import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { CheckCircle, Mail } from "lucide-react";

interface EmailConfirmationSuccessProps {
  onNavigateToLogin: () => void;
}

export function EmailConfirmationSuccess({ onNavigateToLogin }: EmailConfirmationSuccessProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Email confirmé !
          </CardTitle>
          <CardDescription className="text-gray-600">
            Votre adresse email a été vérifiée avec succès.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Mail className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Confirmation réussie</span>
              </div>
              <p className="text-sm text-green-700">
                Vous pouvez maintenant vous connecter à votre compte SOMBANGO.
              </p>
            </div>

            <div className="text-sm text-gray-500">
              <p>Cliquez sur le bouton ci-dessous pour vous connecter.</p>
            </div>
          </div>

          <Button
            onClick={onNavigateToLogin}
            className="w-full bg-green-600 hover:bg-blue-700 text-white"
          >
            Se connecter maintenant
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}