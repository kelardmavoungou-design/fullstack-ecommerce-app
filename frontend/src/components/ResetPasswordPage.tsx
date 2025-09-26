import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle, Lock } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useNavigate, useSearchParams } from "react-router-dom";

interface ResetPasswordPageProps {
  onNavigateToLogin: () => void;
}

export function ResetPasswordPage({ onNavigateToLogin }: ResetPasswordPageProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Récupérer le token depuis l'URL
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      toast.error("Lien de réinitialisation invalide ou expiré");
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [searchParams, navigate]);

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
    };
  };

  const passwordValidation = validatePassword(password);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (!passwordValidation.isValid) {
      toast.error("Le mot de passe ne respecte pas les critères de sécurité");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          newPassword: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast.success("Mot de passe réinitialisé avec succès !");

        // Redirection automatique après 3 secondes
        setTimeout(() => {
          onNavigateToLogin();
        }, 3000);
      } else {
        toast.error(data.message || "Erreur lors de la réinitialisation du mot de passe");
      }

    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur lors de la réinitialisation du mot de passe");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex">
        {/* Left side - Success Message */}
        <div className="flex-1 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md space-y-8 text-center">
            {/* Logo */}
            <div>
              <h1 className="text-4xl font-bold">
                <span className="text-orange-500">SOMBA</span>
                <span className="text-gray-700">shop</span>
              </h1>
            </div>

            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>

            {/* Success Message */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                Mot de passe réinitialisé !
              </h2>
              <p className="text-gray-600">
                Votre mot de passe a été changé avec succès. Vous allez être redirigé vers la page de connexion.
              </p>
            </div>

            {/* Auto redirect message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Redirection automatique dans quelques secondes...
              </p>
            </div>

            {/* Manual redirect button */}
            <Button
              onClick={onNavigateToLogin}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-full font-medium"
            >
              Se connecter maintenant
            </Button>
          </div>
        </div>

        {/* Right side - Image */}
        <div className="flex-1 bg-gradient-to-br from-orange-100 to-pink-100 relative overflow-hidden">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1639945313904-38c513d2f7d1?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Password reset success background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-orange-500/20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <h1 className="text-4xl font-bold">
              <span className="text-orange-500">SOMBA</span>
              <span className="text-gray-700">shop</span>
            </h1>
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">
              Nouveau mot de passe
            </h2>
            <p className="text-gray-600">
              Choisissez un mot de passe sécurisé pour votre compte.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Votre nouveau mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmer votre mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Le mot de passe doit contenir :</p>
              <div className="space-y-1 text-sm">
                <div className={`flex items-center space-x-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="h-4 w-4" />
                  <span>Au moins 8 caractères</span>
                </div>
                <div className={`flex items-center space-x-2 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="h-4 w-4" />
                  <span>Une lettre majuscule</span>
                </div>
                <div className={`flex items-center space-x-2 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="h-4 w-4" />
                  <span>Une lettre minuscule</span>
                </div>
                <div className={`flex items-center space-x-2 ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="h-4 w-4" />
                  <span>Un chiffre</span>
                </div>
                <div className={`flex items-center space-x-2 ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="h-4 w-4" />
                  <span>Un caractère spécial</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !passwordValidation.isValid || password !== confirmPassword}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium"
            >
              {isLoading ? "RÉINITIALISATION..." : "RÉINITIALISER LE MOT DE PASSE"}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="text-center text-sm text-gray-600">
            <button
              onClick={onNavigateToLogin}
              className="text-orange-500 hover:text-orange-600 underline"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="flex-1 bg-gradient-to-br from-orange-100 to-pink-100 relative overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1639945313904-38c513d2f7d1?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Password reset background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-orange-500/20"></div>
      </div>
    </div>
  );
}