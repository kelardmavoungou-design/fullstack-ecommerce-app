import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Mail, Clock, ArrowLeft } from "lucide-react";

interface EmailWaitingPageProps {
  email: string;
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

export function EmailWaitingPage({ email, onNavigateToLogin, onNavigateToRegister }: EmailWaitingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Vérifiez votre email
          </CardTitle>
          <CardDescription className="text-gray-600">
            Nous avons envoyé un email de confirmation à
            <br />
            <span className="font-medium text-gray-900">{email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-1">Cliquez sur le lien de confirmation</p>
                <p className="text-blue-700">
                  Ouvrez votre boîte email et cliquez sur le bouton "Confirmer mon email"
                  pour activer votre compte.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 mb-1">Le lien expire dans 24 heures</p>
                <p className="text-yellow-700">
                  Si vous ne recevez pas l'email, vérifiez votre dossier spam.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="text-sm text-gray-500">
              <p>Cliquez sur le bouton ci-dessous pour aller à la page de connexion.</p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={onNavigateToLogin}
                className="w-full"
              >
                Aller à la page de connexion
              </Button>

              <Button
                variant="ghost"
                onClick={onNavigateToRegister}
                className="w-full text-sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l'inscription
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}