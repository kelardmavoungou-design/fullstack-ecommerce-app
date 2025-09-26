import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import * as React from "react";
import { Facebook } from "lucide-react";


interface LoginPageProps {
  onNavigateToRegister: () => void;
  onNavigateHome: () => void;
  onNavigateToSellerDashboard: () => void;
  onNavigateToAdminDashboard: () => void;
  onNavigateToLogin: () => void;
  onNavigateToForgotPassword: () => void;
}

export function LoginPage({
  onNavigateToRegister,
  onNavigateHome,
  onNavigateToSellerDashboard,
  onNavigateToAdminDashboard,
  onNavigateToLogin,
  onNavigateToForgotPassword,
}: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, oauthLogin, user } = useAuth();

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (user && user.role) {
      console.log('🔄 Utilisateur déjà authentifié, redirection vers la page appropriée:', user.role);
      switch (user.role) {
        case 'buyer':
          onNavigateHome();
          break;
        case 'seller':
          onNavigateToSellerDashboard();
          break;
        case 'superadmin':
          onNavigateToAdminDashboard();
          break;
        case 'delivery':
          window.location.href = '/dashboard-delivery'; // Delivery users go to delivery dashboard
          break;
        default:
          onNavigateToLogin();
      }
    }
  }, [user]); // Remove navigation functions from dependencies to prevent re-runs

  // Vérifier si l'utilisateur vient de confirmer son email ou d'un OAuth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    // Handle email confirmation
    if (urlParams.get('confirmed') === 'true') {
      toast.success("🎉 Email confirmé avec succès ! Vous pouvez maintenant vous connecter.");
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // Handle OAuth login
    const accessToken = urlParams.get('accessToken');
    const oauth = urlParams.get('oauth');
    const error = urlParams.get('error');

    if (error === 'oauth_failed') {
      toast.error("Échec de la connexion OAuth. Veuillez réessayer.");
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (accessToken && oauth) {
      console.log('🔄 Processing OAuth login:', { accessToken: accessToken.substring(0, 20) + '...', oauth });

      // Handle successful OAuth login using AuthContext
      const handleOAuthLogin = async () => {
        try {
          console.log('📡 Calling oauthLogin method...');
          const result = await oauthLogin(accessToken, oauth as 'google' | 'facebook');
          console.log('📦 OAuth login result:', result);

          if (result.success && result.user) {
            const user = result.user;
            console.log('✅ OAuth login successful, user:', user);
            toast.success(`Connexion réussie avec ${oauth === 'google' ? 'Google' : 'Facebook'} ! Bienvenue ${user.full_name}`);

            // Redirect based on user role
            setTimeout(() => {
              console.log('🔄 Redirecting to dashboard for role:', user.role);
              switch (user.role) {
                case 'buyer':
                  window.location.href = '/';
                  break;
                case 'seller':
                  window.location.href = '/seller-dashboard';
                  break;
                case 'superadmin':
                  window.location.href = '/admin-dashboard';
                  break;
                case 'delivery':
                  window.location.href = '/dashboard-delivery';
                  break;
                default:
                  window.location.href = '/';
              }
            }, 1000);
          } else {
            console.error("❌ OAuth login failed:", result);
            toast.error("Connexion réussie, mais impossible de récupérer les infos utilisateur.");
          }
        } catch (error) {
          console.error('💥 OAuth login error:', error);
          toast.error("Erreur lors de la connexion OAuth");
        }
      };

      handleOAuthLogin();
    }
  }, [oauthLogin]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('🔐 Tentative de connexion avec:', { email, password });

    try {
      const result = await login(email, password) as { success: boolean; user?: any; requiresOTP?: boolean };
      console.log('📦 Résultat de login:', result);

      if (result.success) {
        if (result.user) {
          console.log('✅ Utilisateur trouvé:', result.user);
          toast.success(`Connexion réussie ! Bienvenue ${result.user.full_name}`);

          // Redirection basée sur le rôle
          console.log('🔄 Redirection vers la page appropriée pour le rôle:', result.user.role);
          setTimeout(() => {
            switch (result.user.role) {
              case 'buyer':
                console.log('🏠 Redirection vers la page d\'accueil');
                onNavigateHome();
                break;
              case 'seller':
                console.log('🏪 Redirection vers le dashboard vendeur');
                onNavigateToSellerDashboard();
                break;
              case 'superadmin':
                console.log('👑 Redirection vers le dashboard admin');
                onNavigateToAdminDashboard();
                break;
              case 'delivery':
                console.log('🚚 Redirection vers l\'interface livreur');
                window.location.href = '/dashboard-delivery';
                break;
              default:
                console.log('❓ Rôle inconnu, redirection vers login');
                onNavigateToLogin();
            }
          }, 1000);
        } else if (result.requiresOTP) {
          console.log('📱 OTP requis');
          // Handle OTP requirement if needed
          toast.info("Vérification OTP requise");
        } else {
          console.log('❌ Pas d\'utilisateur dans la réponse');
          toast.error("Email ou mot de passe incorrect");
        }
      } else {
        console.log('❌ Échec de connexion');
        toast.error("Email ou mot de passe incorrect");
      }
    } catch (error) {
      console.error('💥 Erreur lors de la connexion:', error);
      toast.error("Erreur lors de la connexion");
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
    </svg>);

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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <Input
                  type="password"
                  placeholder="mot de passe"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
                    setRememberMe(checked === true)
                  }
                />
                <Label
                  htmlFor="remember"
                  className="text-gray-600"
                >
                  se souvenir de moi
                </Label>
              </div>
              <button
                type="button"
                onClick={onNavigateToForgotPassword}
                className="text-gray-500 hover:text-orange-500 underline"
              >
                mot de passe oublié ?
              </button>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-full font-medium text-lg"
            >
              {isLoading ? "CONNEXION..." : "CONNEXION"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                OU
              </span>
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
              <span>Continuer avec Facebook</span>
            </Button>

            <Button
              type="button"
              onClick={() => handleSocialLogin("Google")}
              variant="outline"
              className="w-full border border-gray-300 py-3 rounded-lg font-medium flex items-center justify-center space-x-3 hover:bg-gray-50 transition-all duration-200"
            >
              <GoogleIcon />
              <span>Continuer avec Google</span>
            </Button>
          </div>

          {/* Register Link */}
          <div className="text-center text-sm text-gray-600">
            Vous n'avez pas de compte ?{" "}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="text-gray-900 underline hover:text-orange-500"
            >
              Inscrivez-vous
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="flex-1 bg-gradient-to-br from-orange-100 to-pink-100 relative overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1639945313904-38c513d2f7d1?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Online shopping mobile background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-orange-500/20"></div>
      </div>
    </div>
  );
}