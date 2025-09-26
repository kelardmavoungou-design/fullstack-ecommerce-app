import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import React from 'react';
import { Facebook } from "lucide-react";


interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onNavigateToEmailWaiting?: (email: string) => void;
}

export function RegisterPage({ onNavigateToLogin, onNavigateToEmailWaiting }: RegisterPageProps) {
  const [formData, setFormData] = useState<{
    full_name: string;
    email: string;
    phone_number: string;
    password: string;
    confirmPassword: string;
    role: 'buyer' | 'seller' | '';
  }>({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
    role: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register, user } = useAuth();

  // Redirect authenticated users away from register page
  useEffect(() => {
    if (user && user.role) {
      console.log('🔄 Utilisateur déjà authentifié, redirection vers la page appropriée:', user.role);
      onNavigateToLogin(); // Always redirect to login for authenticated users on register page
    }
  }, [user]); // Remove navigation function from dependencies to prevent re-runs

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value as any }));
  };

  const handleAccountTypeChange = (role: 'buyer' | 'seller') => {
    setFormData(prev => ({
      ...prev,
      role: role
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.full_name.trim() || !formData.email.trim() || !formData.phone_number.trim() || !formData.password.trim() || !formData.confirmPassword.trim()) {
      toast.error("Tous les champs sont requis");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    if (!formData.role) {
      toast.error("Veuillez sélectionner un type de compte");
      setIsLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      const result = await register(registerData as any);
      if (result && result.success) {
        toast.success("Inscription réussie ! Vérifiez votre email pour confirmer votre compte.");
        // Rediriger vers la page d'attente d'email
        setTimeout(() => {
          if (onNavigateToEmailWaiting) {
            onNavigateToEmailWaiting(formData.email);
          } else {
            onNavigateToLogin();
          }
        }, 1500);
      } else {
        // Use the specific error message from the backend
        const errorMessage = (result as any).error || "Erreur lors de l'inscription";
        toast.error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message;
      if (errorMessage) {
        toast.error(errorMessage);
      } else {
        toast.error("Erreur lors de l'inscription");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    if (provider === 'Facebook') {
      window.location.href = 'http://localhost:4000/api/auth/facebook';
    } else if (provider === 'Google') {
      window.location.href = 'http://localhost:4000/api/auth/google';
    }
  };

  const GoogleIcon = () => (
    <svg
      className="h-5 w-5"
      viewBox="0 0 533.5 544.3"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M533.5 278.4c0-17.4-1.4-34.5-4.1-51H272v96.6h146.9c-6.4 34.7-25.1 64.1-53.6 83.7v69.6h86.7c50.8-46.8 81.5-115.7 81.5-198.9z"
        fill="#4285F4"
      />
      <path
        d="M272 544.3c72.6 0 133.6-24 178.1-65.1l-86.7-69.6c-24.1 16.2-54.8 25.7-91.4 25.7-70.3 0-130-47.5-151.3-111.2H31.5v69.9C76.7 477.1 167.8 544.3 272 544.3z"
        fill="#34A853"
      />
      <path
        d="M120.7 323.9c-5.6-16.7-8.8-34.5-8.8-52.9s3.2-36.2 8.8-52.9V148.2H31.5c-18.5 36.9-29 78.3-29 122.8s10.5 85.9 29 122.8l89.2-69.9z"
        fill="#FBBC05"
      />
      <path
        d="M272 107.7c39.6 0 75.1 13.6 103.2 40.2l77.4-77.4C405.6 24 344.6 0 272 0 167.8 0 76.7 67.2 31.5 168.2l89.2 69.9c21.3-63.7 81-111.2 151.3-111.2z"
        fill="#EA4335"
      />
    </svg>
  );


  return (
    <div className="min-h-screen flex">
      {/* Left side - Image */}
      <div className="flex-1 bg-gradient-to-br from-teal-600 to-teal-800 relative overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1680117386690-4892ff56caf8?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Ecommerce store front background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-teal-700/30"></div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">
              <span className="text-orange-500">SOMBA</span>
              <span className="text-gray-700">shop</span>
            </h1>
            <p className="text-gray-600 text-lg">Inscription</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Nom d'utilisateur"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <Input
                  type="tel"
                  placeholder="Numéro de téléphone"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  autoComplete="tel"
                  required
                />
              </div>

              <div>
                <Input
                  type="password"
                  placeholder="mot de passe"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div>
                <Input
                  type="password"
                  placeholder="Confirmez le mot de passe"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="space-y-3">
                <div className="text-somba-primary font-medium">
                  Sélectionnez votre rôle :
                </div>
                <RadioGroup
                  value={formData.role}
                  onValueChange={handleAccountTypeChange}
                  className="flex flex-wrap gap-6 justify-center"
                >
                  <div className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <RadioGroupItem
                      value="buyer"
                      id="buyer"
                      className="border-gray-300 data-[state=checked]:bg-somba-accent data-[state=checked]:border-somba-accent"
                    />
                    <Label
                      htmlFor="buyer"
                      className="font-medium leading-none cursor-pointer select-none"
                    >
                      acheteur
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <RadioGroupItem
                      value="seller"
                      id="seller"
                      className="border-gray-300 data-[state=checked]:bg-somba-accent data-[state=checked]:border-somba-accent"
                    />
                    <Label
                      htmlFor="seller"
                      className="font-medium leading-none cursor-pointer select-none"
                    >
                      vendeur
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Register Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-full font-medium text-lg"
            >
              {isLoading ? "INSCRIPTION..." : "S'INSCRIRE"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OU</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <Button
              type="button"
              onClick={() => handleSocialLogin("Facebook")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-3 transition-all duration-200"
            >
              <Facebook className="h-5 w-5" />
              <span>S'inscrire avec Facebook</span>
            </Button>

            <Button
              type="button"
              onClick={() => handleSocialLogin("Google")}
              variant="outline"
              className="w-full border border-gray-300 py-3 rounded-lg font-medium flex items-center justify-center space-x-3 hover:bg-gray-50 transition-all duration-200"
            >
              <GoogleIcon />
              <span>S'inscrire avec Google</span>
            </Button>

          </div>

          {/* Login Link */}
          <div className="text-center text-sm text-gray-600">
            Vous avez déjà un compte ?{" "}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-gray-900 underline hover:text-orange-500"
            >
              se connecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}