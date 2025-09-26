import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { ArrowLeft, Mail, Phone, Shield, CheckCircle, Eye, EyeOff } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface FacebookPasswordRecoveryProps {
  onNavigateToLogin: () => void;
}

export function FacebookPasswordRecovery({ onNavigateToLogin }: FacebookPasswordRecoveryProps) {
  // États pour les différentes étapes
  const [currentStep, setCurrentStep] = useState(0);
  const [identifier, setIdentifier] = useState("");
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [availableMethods, setAvailableMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Étape 0: Accès à la fonction
  const renderStep0 = () => (
    <div className="text-center space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Mot de passe oublié ?
        </h2>
        <p className="text-gray-600 mt-2">
          Pas de problème ! Nous allons vous aider à récupérer l'accès à votre compte.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Shield className="h-6 w-6 text-blue-600" />
          <div className="text-left">
            <p className="font-medium text-blue-900">Processus sécurisé</p>
            <p className="text-sm text-blue-700">
              Nous vérifions votre identité avant de vous donner accès à votre compte.
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={() => setCurrentStep(1)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
      >
        Commencer la récupération
      </Button>
    </div>
  );

  // Étape 1: Identification du compte
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          Retrouver votre compte
        </h2>
        <p className="text-gray-600 mt-2">
          Entrez votre email, numéro de téléphone ou nom d'utilisateur
        </p>
      </div>

      <form onSubmit={handleIdentifyAccount} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="identifier">Email, téléphone ou nom d'utilisateur</Label>
          <Input
            id="identifier"
            type="text"
            placeholder="ex: monemail@gmail.com ou +22501020304"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || !identifier}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
        >
          {isLoading ? "RECHERCHE..." : "CHERCHER MON COMPTE"}
        </Button>
      </form>

      <div className="text-center">
        <button
          onClick={() => setCurrentStep(0)}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          ← Retour
        </button>
      </div>
    </div>
  );

  // Étape 2: Proposition de méthodes de vérification
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          Comment voulez-vous recevoir le code ?
        </h2>
        <p className="text-gray-600 mt-2">
          Nous avons trouvé votre compte <strong>{userName}</strong>
        </p>
      </div>

      <div className="space-y-3">
        {availableMethods.map((method, index) => (
          <button
            key={index}
            onClick={() => handleSelectMethod(method.type)}
            className={`w-full flex items-center justify-between p-4 border rounded-lg transition-colors ${
              selectedMethod === method.type
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-300 hover:bg-blue-25'
            }`}
          >
            <div className="flex items-center space-x-3">
              {method.type === 'email' ? (
                <Mail className="h-6 w-6 text-gray-600" />
              ) : (
                <Phone className="h-6 w-6 text-gray-600" />
              )}
              <div className="text-left">
                <p className="font-medium text-gray-900">
                  {method.type === 'email' ? 'Email' : 'SMS'}
                </p>
                <p className="text-sm text-gray-600">{method.masked}</p>
              </div>
            </div>
            {selectedMethod === method.type && (
              <CheckCircle className="h-5 w-5 text-blue-600" />
            )}
          </button>
        ))}
      </div>

      <Button
        onClick={handleSendVerificationCode}
        disabled={isLoading || !selectedMethod}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
      >
        {isLoading ? "ENVOI EN COURS..." : "ENVOYER LE CODE"}
      </Button>

      <div className="text-center">
        <button
          onClick={() => setCurrentStep(1)}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          ← Utiliser un autre identifiant
        </button>
      </div>
    </div>
  );

  // Étape 3: Saisie du code de vérification
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          Entrez le code de vérification
        </h2>
        <p className="text-gray-600 mt-2">
          Nous avons envoyé un code à votre {selectedMethod === 'email' ? 'email' : 'téléphone'}
        </p>
      </div>

      <form onSubmit={handleVerifyCode} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">Code de vérification</Label>
          <Input
            id="code"
            type="text"
            placeholder="Entrez le code de vérification"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
            maxLength={6}
            required
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || verificationCode.length !== 6}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
        >
          {isLoading ? "VÉRIFICATION..." : "VÉRIFIER LE CODE"}
        </Button>
      </form>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-500">
          Vous n'avez pas reçu le code ?
        </p>
        <button
          onClick={handleResendCode}
          disabled={isLoading}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Renvoyer le code
        </button>
      </div>

      <div className="text-center">
        <button
          onClick={() => setCurrentStep(2)}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          ← Changer de méthode
        </button>
      </div>
    </div>
  );

  // Étape 4: Réinitialisation du mot de passe
  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          Créer un nouveau mot de passe
        </h2>
        <p className="text-gray-600 mt-2">
          Choisissez un mot de passe sécurisé pour votre compte
        </p>
      </div>

      <form onSubmit={handleResetPassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newPassword">Nouveau mot de passe</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Votre nouveau mot de passe"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirmer votre mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        <Button
          type="submit"
          disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
        >
          {isLoading ? "MISE À JOUR..." : "METTRE À JOUR LE MOT DE PASSE"}
        </Button>
      </form>

      <div className="text-center">
        <button
          onClick={() => setCurrentStep(5)}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Continuer sans changer le mot de passe →
        </button>
      </div>
    </div>
  );

  // Étape 5: Sécurité et finalisation
  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Récupération terminée !
        </h2>
        <p className="text-gray-600 mt-2">
          Votre compte est maintenant sécurisé
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-900 mb-2">Recommandations de sécurité :</h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Déconnectez-vous de tous les autres appareils</li>
          <li>• Vérifiez vos connexions récentes</li>
          <li>• Utilisez un mot de passe fort</li>
        </ul>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleSecureLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
        >
          Se connecter maintenant
        </Button>

        <Button
          onClick={onNavigateToLogin}
          variant="outline"
          className="w-full py-3 rounded-lg font-medium"
        >
          Retour à la page de connexion
        </Button>
      </div>
    </div>
  );

  // Gestionnaires d'événements
  const handleIdentifyAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/auth/identify-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });

      const data = await response.json();

      if (response.ok && data.found) {
        setUserId(data.userId);
        setUserName(data.userName);
        setAvailableMethods(data.availableMethods);
        setCurrentStep(2);
        toast.success("Compte trouvé !");
      } else {
        toast.error(data.message || "Aucun compte trouvé avec cet identifiant");
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur lors de la recherche du compte");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMethod = (method: string) => {
    setSelectedMethod(method);
  };

  const handleSendVerificationCode = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, method: selectedMethod })
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentStep(3);
        toast.success(`Code envoyé par ${selectedMethod === 'email' ? 'email' : 'SMS'} !`);
      } else {
        toast.error(data.message || "Erreur lors de l'envoi du code");
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur lors de l'envoi du code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: verificationCode })
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setUser(data.user);
        setCurrentStep(4);
        toast.success("Code vérifié avec succès !");
      } else {
        toast.error(data.message || "Code invalide");
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur lors de la vérification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    await handleSendVerificationCode();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/auth/reset-password-with-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          code: verificationCode,
          newPassword,
          confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentStep(5);
        toast.success("Mot de passe mis à jour avec succès !");
      } else {
        toast.error(data.message || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecureLogin = async () => {
    setIsLoading(true);

    try {
      // Since the password was just reset, we can log in directly without OTP verification
      // The user has already been verified through the recovery process
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email || identifier,
          password: newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Sauvegarder le token
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        toast.success("Connexion réussie ! Bienvenue !");
        // Rediriger vers le dashboard approprié selon le rôle
        const userRole = data.user.role;
        if (userRole === 'seller') {
          window.location.href = '/seller-dashboard';
        } else if (userRole === 'superadmin') {
          window.location.href = '/admin-dashboard';
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        toast.error(data.message || "Erreur lors de la connexion");
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur lors de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  // Rendu principal
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderStep0();
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep0();
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <h1 className="text-4xl font-bold">
              <span className="text-blue-600">SOMBA</span>
              <span className="text-gray-700">shop</span>
            </h1>
          </div>

          {/* Progress indicator */}
          {currentStep > 0 && currentStep < 5 && (
            <div className="flex justify-center space-x-2 mb-6">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Current step content */}
          {renderCurrentStep()}

          {/* Back to login */}
          <div className="text-center text-sm text-gray-600">
            <button
              onClick={onNavigateToLogin}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="flex-1 bg-gradient-to-br from-blue-100 to-purple-100 relative overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1639945313904-38c513d2f7d1?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Password recovery background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-blue-500/20"></div>
      </div>
    </div>
  );
}