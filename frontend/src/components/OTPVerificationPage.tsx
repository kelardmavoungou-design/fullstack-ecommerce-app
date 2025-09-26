import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import authService from "../services/authService";
import { toast } from "sonner";

interface OTPVerificationPageProps {
  email: string;
  userId: string;
  onVerificationSuccess: () => void;
  onBackToRegister: () => void;
}

export function OTPVerificationPage({
  email,
  userId,
  onVerificationSuccess,
  onBackToRegister
}: OTPVerificationPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirmEmail = async () => {
    setLoading(true);
    setError("");

    try {
      // Auto-generate OTP for confirmation (simplified flow)
      const autoOTP = "123456"; // In production, this would be sent via email

      const result = await authService.verifyOTP({
        userId,
        otp: autoOTP,
        type: "registration"
      });

      if (result.success) {
        toast.success("Email confirmé avec succès !");
        onVerificationSuccess();
      } else {
        setError(result.error || "Erreur lors de la confirmation");
      }
    } catch (error) {
      setError("Erreur lors de la confirmation. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");

    try {
      // Pour les tests, on peut utiliser un OTP fixe
      // En production, cela renverrait un nouvel email
      toast.info("Pour les tests : utilisez le code OTP affiché dans les logs du serveur");
      setError("Consultez les logs du serveur backend pour obtenir le code OTP");
    } catch (error) {
      setError("Erreur lors de l'envoi du code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Vérifiez votre email
          </CardTitle>
          <CardDescription className="text-gray-600">
            Confirmez votre adresse email pour finaliser l'inscription
            <br />
            <span className="font-medium text-gray-900">{email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Un email de confirmation a été envoyé à votre adresse.
              Cliquez sur le bouton ci-dessous pour confirmer votre email.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleConfirmEmail}
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 text-green w-4 animate-spin" />
                Confirmation...
              </>
            ) : (
              "Confirmer mon email"
            )}
          </Button>

          <div className="text-center space-y-4">
            <Button
              variant="ghost"
              onClick={handleResendOTP}
              disabled={loading}
              className="text-sm"
            >
              Renvoyer le code
            </Button>

            <div>
              <Button
                variant="ghost"
                onClick={onBackToRegister}
                disabled={loading}
                className="text-sm text-gray-500"
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