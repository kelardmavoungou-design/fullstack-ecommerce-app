import React, { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useCart } from "./CartContext";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import {
  CheckCircle,
  CreditCard,
  Smartphone,
  Banknote,
  Loader2,
  Shield,
  Lock,
  Truck,
  MapPin,
  User,
  Phone,
  Mail,
  AlertCircle,
  Check,
  Clock,
  LogIn,
  UserPlus,
  ArrowRight,
  ShoppingCart
} from "lucide-react";
import orderService from "../services/orderService";
import paymentService from "../services/paymentService";
import cartService from "../services/cartService";
import { Order } from "../services/api";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

// Checkout Guard Component - Handles authentication check
const CheckoutGuard = ({ children, onNavigateToLogin, onNavigateToRegister }: {
  children: React.ReactNode;
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const { items, getTotalItems, getTotalPrice } = useCart();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    // If user is not authenticated and has items in cart, show auth prompt
    if (!loading && !isAuthenticated && getTotalItems() > 0) {
      setShowAuthPrompt(true);
    } else if (isAuthenticated) {
      setShowAuthPrompt(false);
    }
  }, [isAuthenticated, loading, items]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Vérification de l'authentification...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show authentication prompt if user is not authenticated
  if (showAuthPrompt && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">SOMBAGO</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Lock className="h-4 w-4" />
                Authentification requise
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <Card className="shadow-2xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="text-center text-xl flex items-center justify-center gap-2">
                <User className="h-6 w-6" />
                Connexion Requise
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8 text-center">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <User className="h-10 w-10 text-blue-600" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900">Connectez-vous pour continuer</h2>
                  <p className="text-lg text-gray-600">
                    Vous devez être connecté pour procéder au paiement de votre commande
                  </p>
                </div>

                {/* Cart Summary */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-4">Votre panier</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Articles ({getTotalItems()})</span>
                      <span className="font-medium">{getTotalItems()} article{getTotalItems() > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-blue-600">{new Intl.NumberFormat('fr-FR').format(getTotalPrice())} F CFA</span>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Paiement sécurisé</p>
                    <p className="text-xs text-gray-600">Données protégées</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <Truck className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Livraison rapide</p>
                    <p className="text-xs text-gray-600">2-3 jours ouvrables</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Suivi commande</p>
                    <p className="text-xs text-gray-600">En temps réel</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={onNavigateToLogin}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-6 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <LogIn className="h-5 w-5" />
                  Se connecter
                  <ArrowRight className="h-5 w-5" />
                </button>

                <div className="text-center">
                  <p className="text-gray-600 mb-2">Pas encore de compte ?</p>
                  <button
                    onClick={onNavigateToRegister}
                    className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    Créer un compte
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If authenticated, show the checkout
  return <>{children}</>;
};

// Simple QR Code component using canvas
const QRCodeCanvas = ({ value, size = 200 }: { value: string; size?: number }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Simple placeholder for QR code - just a pattern
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#ffffff';

        // Create a simple pattern that looks like a QR code
        const cellSize = size / 20;
        for (let i = 0; i < 20; i++) {
          for (let j = 0; j < 20; j++) {
            if ((i + j) % 3 === 0 || (i * j) % 7 === 0) {
              ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
            }
          }
        }

        // Add text in center
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR', size / 2, size / 2 - 10);
        ctx.fillText('CODE', size / 2, size / 2 + 10);
      }
    }
  }, [value, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="border rounded" />;
};

// Stripe Card Element styling
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      '::placeholder': {
        color: '#9ca3af',
      },
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontWeight: '400',
      lineHeight: '1.5',
    },
    invalid: {
      color: '#dc2626',
      iconColor: '#dc2626',
    },
    complete: {
      color: '#059669',
      iconColor: '#059669',
    },
  },
};

// Card Payment Form Component
const CardPaymentForm = ({ onPaymentMethodCreated }: { onPaymentMethodCreated: (paymentMethod: any) => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Élément de carte non trouvé');
      setLoading(false);
      return;
    }

    try {
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (stripeError) {
        setError(stripeError.message || 'Erreur lors de la création du moyen de paiement');
        setLoading(false);
        return;
      }

      onPaymentMethodCreated(paymentMethod);
    } catch (err) {
      setError('Erreur lors du traitement de la carte');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
        <Shield className="h-5 w-5 text-green-600" />
        <div className="text-sm">
          <p className="font-medium text-green-800">Paiement sécurisé</p>
          <p className="text-green-600">Vos informations sont chiffrées et protégées par Stripe</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="card-element" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Informations de carte bancaire
          </Label>
          <div className="mt-2 relative">
            <div className="p-4 border-2 border-gray-200 rounded-lg focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-200">
              <CardElement
                id="card-element"
                options={CARD_ELEMENT_OPTIONS}
                onChange={(event) => {
                  setError(event.error ? event.error.message : null);
                  setCardComplete(event.complete);
                }}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            {cardComplete && !error && (
              <div className="flex items-center gap-2 mt-2 text-green-600 text-sm">
                <Check className="h-4 w-4" />
                Informations de carte valides
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!stripe || loading || !cardComplete}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" />
              Validation en cours...
            </>
          ) : (
            <>
              <Lock className="h-5 w-5" />
              Valider la carte
            </>
          )}
        </button>

        {/* Accepted Cards */}
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">Cartes acceptées</p>
          <div className="flex justify-center gap-2">
            <div className="text-xs font-medium text-gray-400">VISA</div>
            <div className="text-xs font-medium text-gray-400">MASTERCARD</div>
            <div className="text-xs font-medium text-gray-400">AMEX</div>
          </div>
        </div>
      </form>
    </div>
  );
};

interface CheckoutPageProps {
  onNavigateHome: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToRegister?: () => void;
}

export function CheckoutPage({ onNavigateHome, onNavigateToLogin, onNavigateToRegister }: CheckoutPageProps) {
  const { items, getTotalPrice, clearCart, refreshCart } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState('form');
  const [loading, setLoading] = useState(false);
  const [cartId, setCartId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<any>(null);

  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    address: "",
    city: "",
    paymentMethod: "",
    phone_number: ""
  });

  const [orderCode, setOrderCode] = useState("");
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);

  const total = getTotalPrice();
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' F CFA';
  };

  // Get cart ID on component mount
  React.useEffect(() => {
    const getCartId = async () => {
      try {
        // Get cart data from API
        const response = await cartService.getCart();
        if (response.success && response.data) {
          // Use the cartId directly from the API response
          if (response.data.cartId) {
            setCartId(response.data.cartId);
          } else {
            console.warn('Cart ID not found in API response');
            setCartId(null);
          }
        } else {
          console.warn('No cart data received from API');
          setCartId(null);
        }
      } catch (error) {
        console.error('Error getting cart:', error);
        toast.error('Erreur lors du chargement du panier');
      }
    };

    if (user) {
      getCartId();
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateOrderCode = () => {
    // Generate a 6-character complicated code with letters and numbers
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'SOMBAGO-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!formData.paymentMethod) {
      toast.error("Veuillez sélectionner un moyen de paiement");
      return;
    }

    if (!formData.address || !formData.city) {
      toast.error("Veuillez remplir l'adresse de livraison");
      return;
    }

    setLoading(true);

    try {
      // First, create the order
      const shippingAddress = `${formData.address}, ${formData.city}`;

      if (!cartId) {
        toast.error("Erreur: ID du panier manquant");
        return;
      }

      const orderData = {
        cartId,
        paymentMethod: formData.paymentMethod === 'espece' ? 'cash_on_delivery' as const :
                      formData.paymentMethod === 'mobile-money' ? 'mobile_money' as const : 'mobile_money' as const,
        shippingAddress
      };

      const orderResponse = await cartService.createOrder(orderData);

      if (!orderResponse.success) {
        toast.error(orderResponse.error || "Erreur lors de la création de la commande");
        return;
      }

      const orderIds = orderResponse.data?.orderIds;
      if (!orderIds || orderIds.length === 0) {
        toast.error("Erreur: Aucun ID de commande reçu");
        return;
      }

      // Generate and set the SOMBAGO-XXXXXX format order code
      setOrderCode(generateOrderCode());

      // Process payment based on method
      if (formData.paymentMethod === "espece") {
        // Cash on delivery - no payment processing needed
        setOrderTotal(total); // Store the total before clearing cart
        toast.success("Commande créée avec succès !");
        clearCart(true); // Clear cart silently
        setStep('qr');
      } else if (formData.paymentMethod === "mobile-money" || formData.paymentMethod === "airtel-money") {
        // Mobile money payment
        if (!formData.phone_number) {
          toast.error("Veuillez saisir votre numéro de téléphone");
          return;
        }

        const provider = formData.paymentMethod === "mobile-money" ? "mtn" : "airtel";

        const paymentData = {
          orderId: orderIds[0],
          phoneNumber: formData.phone_number,
          provider: provider
        };

        const paymentResponse = await paymentService.processMobileMoneyPayment(paymentData);

        if (paymentResponse.success) {
          toast.success("Paiement mobile money initié !");
          clearCart();
          setStep('success');
        } else {
          toast.error(paymentResponse.error || "Erreur lors du paiement mobile money");
        }
      } else if (formData.paymentMethod === "card") {
        // Card payment (Stripe)
        if (!paymentMethod) {
          toast.error("Veuillez saisir les informations de votre carte");
          return;
        }

        const paymentData = {
          orderId: orderIds[0],
          paymentMethodId: paymentMethod.id
        };

        const paymentResponse = await paymentService.processCardPayment(paymentData);

        if (paymentResponse.success) {
          toast.success("Paiement par carte réussi !");
          clearCart();
          setStep('success');
        } else {
          toast.error(paymentResponse.error || "Erreur lors du paiement par carte");
        }
      } else {
        // Handle any other payment methods or show error
        toast.error("Méthode de paiement non reconnue");
      }
    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      toast.error("Une erreur s'est produite lors de la commande");
    } finally {
      setLoading(false);
    }
  };

  const handleQRConfirmation = () => {
    toast.success("Commande confirmée ! Présentez ce code QR lors de la livraison.");
    clearCart(true); // Clear cart silently
    setStep('success');
  };

  if (step === 'qr') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 shadow-lg border-b border-white/20">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">S</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">SOMBAGO</h1>
                  <p className="text-sm text-white/80">Paiement à la livraison</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full">
                <Banknote className="h-5 w-5 text-white" />
                <span className="text-sm font-medium text-white">Commande confirmée</span>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* QR Code Section */}
            <div className="space-y-6">
              <Card className="shadow-2xl border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white border-b-0">
                  <CardTitle className="text-center text-2xl flex items-center justify-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">Commande Confirmée !</div>
                      <div className="text-sm font-medium opacity-90">Paiement à la livraison</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 text-center bg-gradient-to-b from-white to-gray-50">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="w-24 h-24 bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Paiement en espèces</h3>
                        <p className="text-gray-600 leading-relaxed">
                          Présentez ce code QR au livreur pour confirmer votre paiement en espèces lors de la livraison
                        </p>
                      </div>
                    </div>

                    {/* Enhanced QR Code Display */}
                    <div className="relative">
                      <div className="absolute -inset-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl blur opacity-25"></div>
                      <div className="relative bg-white p-8 rounded-xl shadow-2xl border-4 border-white">
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg">
                          <QRCodeCanvas
                            value={`SOMBAGO-ORDER:${orderCode}:${orderTotal}:${user?.email || 'guest'}:${Date.now()}`}
                            size={220}
                          />
                        </div>
                        <div className="mt-4 text-center">
                          <p className="text-sm text-gray-500">Scannez ce code QR</p>
                        </div>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-2">Code de commande</p>
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-blue-200">
                            <p className="text-2xl font-mono font-bold text-blue-700 tracking-wider">
                              {orderCode}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-gray-500">Client</p>
                            <p className="text-lg font-semibold text-gray-900">{user?.full_name}</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-gray-500">Total à payer</p>
                            <p className="text-xl font-bold text-green-600">{formatPrice(orderTotal)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Instructions & Information */}
            <div className="space-y-6">
              {/* Delivery Information */}
              <Card className="shadow-xl border-0">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <CardTitle className="flex items-center gap-3">
                    <Truck className="h-6 w-6" />
                    Informations de livraison
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-blue-600">1</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Préparation de commande</p>
                        <p className="text-sm text-gray-600">Votre commande est en cours de préparation</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-blue-600">2</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Expédition</p>
                        <p className="text-sm text-gray-600">Expédition sous 1-2 jours ouvrables</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Livraison & Paiement</p>
                        <p className="text-sm text-gray-600">Paiement en espèces à la réception</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security & Trust */}
              <Card className="shadow-xl border-0">
                <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
                  <CardTitle className="flex items-center gap-3">
                    <Shield className="h-6 w-6" />
                    Sécurité & Confiance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Shield className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Paiement sécurisé</p>
                        <p className="text-sm text-gray-600">Transaction tracée et sécurisée</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Suivi en temps réel</p>
                        <p className="text-sm text-gray-600">Notifications de livraison</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Livraison estimée</p>
                        <p className="text-sm text-gray-600">2-3 jours ouvrables</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleQRConfirmation}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
                >
                  <CheckCircle className="h-5 w-5" />
                  J'ai sauvegardé le code QR
                </button>
                <button
                  onClick={onNavigateHome}
                  className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  Retour à l'accueil
                </button>
              </div>

              {/* Contact Information */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                <p className="text-sm text-gray-600 mb-2">Besoin d'aide ?</p>
                <p className="text-sm font-medium text-gray-900">Contactez-nous : support@sombago.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">SOMBAGO</h1>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Paiement réussi
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <Card className="shadow-2xl border-0">
            <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="text-center text-xl flex items-center justify-center gap-2">
                <CheckCircle className="h-6 w-6" />
                COMMANDE RÉUSSIE
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8 text-center">
              <div className="space-y-6">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-gray-900">Paiement Confirmé !</h2>
                  <p className="text-lg text-gray-600">
                    Votre commande a été traitée avec succès
                  </p>
                </div>

                {orderCode && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-blue-900">Numéro de commande</p>
                      <p className="text-2xl font-mono font-bold text-blue-700 bg-white p-4 rounded-lg border-2 border-blue-300">
                        {orderCode}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Email de confirmation</p>
                    <p className="text-xs text-gray-600">Envoyé à votre adresse</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <Truck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Suivi de commande</p>
                    <p className="text-xs text-gray-600">Disponible dans votre compte</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Livraison</p>
                    <p className="text-xs text-gray-600">2-3 jours ouvrables</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-4">Que se passe-t-il ensuite ?</h3>
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">1</span>
                      </div>
                      <span className="text-sm text-gray-700">Préparation de votre commande</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">2</span>
                      </div>
                      <span className="text-sm text-gray-700">Expédition vers votre adresse</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700">Livraison et confirmation</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={onNavigateHome}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-6 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  Continuer mes achats
                </button>
                <p className="text-sm text-gray-500">
                  Un email de confirmation a été envoyé à votre adresse
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Default navigation functions if not provided
  const handleNavigateToLogin = onNavigateToLogin || (() => {
    // Default behavior - you can customize this
    window.location.href = '/login';
  });

  const handleNavigateToRegister = onNavigateToRegister || (() => {
    // Default behavior - you can customize this
    window.location.href = '/register';
  });

  return (
    <CheckoutGuard
      onNavigateToLogin={handleNavigateToLogin}
      onNavigateToRegister={handleNavigateToRegister}
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 shadow-lg border-b border-white/20">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">S</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">SOMBAGO</h1>
                  <p className="text-sm text-white/80">Votre plateforme e-commerce de confiance</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full">
                <Lock className="h-5 w-5 text-white" />
                <span className="text-sm font-medium text-white">Paiement 100% sécurisé</span>
                <Shield className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-green-600">Panier</span>
            </div>
            <div className="w-16 h-0.5 bg-green-500"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">2</span>
              </div>
              <span className="text-sm font-medium text-green-600">Paiement</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-gray-500">3</span>
              </div>
              <span className="text-sm font-medium text-gray-500">Confirmation</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="text-center text-xl flex items-center justify-center gap-2">
                  <CheckCircle className="h-6 w-6" />
                  FINALISER VOTRE COMMANDE
                </CardTitle>
              </CardHeader>

              <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Coordonnées */}
              <div>
                <h3 className="text-lg font-bold mb-4">Coordonnées</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Nom complet</Label>
                    <Input
                      id="fullName"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Moyens de paiement */}
              <div>
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Moyens de paiement
                </h3>
                <RadioGroup
                  value={formData.paymentMethod}
                  onValueChange={(value) => handleInputChange('paymentMethod', value)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {/* Mobile Money */}
                  <div className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    formData.paymentMethod === 'mobile-money'
                      ? 'border-orange-500 bg-orange-50 shadow-md'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
                  }`}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="mobile-money" id="mobile-money" className="mt-0.5" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Smartphone className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <Label htmlFor="mobile-money" className="font-medium text-gray-900 cursor-pointer">
                            MTN Mobile Money
                          </Label>
                          <p className="text-xs text-gray-500">Paiement via MTN MoMo</p>
                        </div>
                      </div>
                    </div>
                    {formData.paymentMethod === 'mobile-money' && (
                      <div className="absolute top-2 right-2 w-3 h-3 bg-orange-500 rounded-full"></div>
                    )}
                  </div>

                  {/* Airtel Money */}
                  <div className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    formData.paymentMethod === 'airtel-money'
                      ? 'border-red-500 bg-red-50 shadow-md'
                      : 'border-gray-200 hover:border-red-300 hover:bg-red-25'
                  }`}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="airtel-money" id="airtel-money" className="mt-0.5" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <Smartphone className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <Label htmlFor="airtel-money" className="font-medium text-gray-900 cursor-pointer">
                            Airtel Money
                          </Label>
                          <p className="text-xs text-gray-500">Paiement via Airtel Money</p>
                        </div>
                      </div>
                    </div>
                    {formData.paymentMethod === 'airtel-money' && (
                      <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full"></div>
                    )}
                  </div>

                  {/* Carte bancaire */}
                  <div className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    formData.paymentMethod === 'card'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                  }`}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="card" id="card" className="mt-0.5" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <Label htmlFor="card" className="font-medium text-gray-900 cursor-pointer">
                            Carte bancaire
                          </Label>
                          <p className="text-xs text-gray-500">Visa, Mastercard, Amex</p>
                        </div>
                      </div>
                    </div>
                    {formData.paymentMethod === 'card' && (
                      <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full"></div>
                    )}
                  </div>

                  {/* Espèces */}
                  <div className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    formData.paymentMethod === 'espece'
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-25'
                  }`}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="espece" id="espece" className="mt-0.5" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Banknote className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <Label htmlFor="espece" className="font-medium text-gray-900 cursor-pointer">
                            Espèces
                          </Label>
                          <p className="text-xs text-gray-500">Paiement à la livraison</p>
                        </div>
                      </div>
                    </div>
                    {formData.paymentMethod === 'espece' && (
                      <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                </RadioGroup>
              </div>

              {/* Payment Details - Show based on payment method */}
              {formData.paymentMethod && (
                <div className="space-y-6">
                  {(formData.paymentMethod === "mobile-money" || formData.paymentMethod === "airtel-money") && (
                    <div className={`p-6 rounded-xl border ${
                      formData.paymentMethod === "mobile-money"
                        ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                        : "bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          formData.paymentMethod === "mobile-money"
                            ? "bg-yellow-100"
                            : "bg-red-100"
                        }`}>
                          <Smartphone className={`h-6 w-6 ${
                            formData.paymentMethod === "mobile-money"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {formData.paymentMethod === "mobile-money" ? "MTN Mobile Money" : "Airtel Money"}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Saisissez votre numéro de téléphone pour recevoir l'invitation de paiement
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Numéro de téléphone
                        </Label>
                        <div className="relative">
                          <Input
                            id="phoneNumber"
                            placeholder="01 02 03 04 05"
                            value={formData.phone_number}
                            onChange={(e) => handleInputChange('phone_number', e.target.value)}
                            className="pl-12 h-12 text-lg border-2 border-gray-200 focus:border-orange-500 rounded-lg"
                            required
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                            <span className="text-sm font-medium text-gray-600">+225</span>
                            <div className="w-px h-6 bg-gray-300"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>
                            Vous recevrez une notification sur votre téléphone pour confirmer le paiement
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.paymentMethod === "card" && (
                    <div className="space-y-4">
                      <Label>Informations de carte bancaire</Label>
                      <Elements stripe={stripePromise}>
                        <CardPaymentForm
                          onPaymentMethodCreated={(pm) => {
                            setPaymentMethod(pm);
                            toast.success("Informations de carte validées");
                          }}
                        />
                      </Elements>
                      {paymentMethod && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-green-800 text-sm">
                            ✓ Carte {paymentMethod.card.brand.toUpperCase()} **** **** **** {paymentMethod.card.last4} validée
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Résumé de la commande</h4>
                    <p className="text-sm text-gray-600">{items.length} article{items.length > 1 ? 's' : ''} dans votre panier</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold text-orange-600">
                            {item.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatPrice(item.unitPrice)} × {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-300 pt-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sous-total</span>
                      <span className="font-medium">{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Livraison</span>
                      <span className="font-medium text-green-600">Gratuite</span>
                    </div>
                    <div className="border-t border-gray-400 pt-2 mt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-gray-900">Total à payer</span>
                        <span className="text-green-600">{formatPrice(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="space-y-4">
                {/* Terms and Conditions */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    required
                  />
                  <div className="text-sm">
                    <Label htmlFor="terms" className="text-gray-700 cursor-pointer">
                      J'accepte les <a href="#" className="text-blue-600 hover:underline">conditions générales de vente</a> et la <a href="#" className="text-blue-600 hover:underline">politique de confidentialité</a>
                    </Label>
                  </div>
                </div>

                {/* Amazon-style Confirmation Button */}
                <div className="space-y-4">
                  {/* Order Total Summary - Amazon style */}
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-normal text-gray-700">Sous-total ({items.length} article{items.length > 1 ? 's' : ''})</span>
                      <span className="text-lg font-normal text-gray-900">{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-normal text-gray-700">Livraison</span>
                      <span className="text-lg font-normal text-green-600">GRATUITE</span>
                    </div>
                    <div className="border-t border-gray-300 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-900">Montant total de la commande</span>
                        <span className="text-2xl font-bold text-gray-900">{formatPrice(total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Amazon-style Orange Button */}
                  <div className="relative">
                    <button
                      type="submit"
                      disabled={loading || !formData.paymentMethod || !formData.address || !formData.city}
                      className="w-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 hover:from-orange-500 hover:via-orange-600 hover:to-orange-700 text-white py-5 px-8 text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-orange-400 disabled:hover:via-orange-500 disabled:hover:to-orange-600 transition-all duration-200 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.01] flex items-center justify-center gap-3 border-2 border-orange-300 focus:outline-none focus:ring-4 focus:ring-orange-300/50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin h-6 w-6" />
                          <span>Traitement en cours...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-6 w-6" />
                          <span>Passer la commande</span>
                        </>
                      )}
                    </button>
                    {/* Amazon-style subtle glow effect */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-400/20 to-orange-600/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>

                  {/* Amazon-style additional info */}
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">
                      En cliquant sur "Passer la commande", vous acceptez nos
                      <a href="#" className="text-blue-600 hover:underline ml-1">Conditions générales de vente</a>
                    </p>
                    <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span>Paiement sécurisé SSL</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Protection acheteur</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amazon-style secondary button */}
                <button
                  type="submit"
                  disabled={loading || !formData.paymentMethod || !formData.address || !formData.city}
                  className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 py-3 px-6 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-gray-100 disabled:hover:to-gray-200 transition-all duration-200 rounded-lg border border-gray-300 hover:border-gray-400 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      <span>Traitement...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirmer et payer • {formatPrice(total)}</span>
                    </>
                  )}
                </button>

                {/* Security Notice */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>Paiement 100% sécurisé</span>
                  </div>
                </div>
              </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-2xl border-0 sticky top-4 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white border-b-0">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">Résumé de commande</div>
                    <div className="text-sm font-medium opacity-90">{items.length} article{items.length > 1 ? 's' : ''}</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-b from-white to-gray-50">
                <div className="space-y-4">
                  {/* Items */}
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center shadow-sm">
                          <span className="text-sm font-bold text-orange-600">
                            {item.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">Prix: {formatPrice(item.unitPrice)}</span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Qté: {item.quantity}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total Section */}
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Sous-total</span>
                        <span className="font-medium">{formatPrice(total)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Livraison</span>
                        <span className="font-medium text-green-600">Gratuite</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span className="text-gray-900">Total</span>
                          <span className="text-green-600">{formatPrice(total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Truck className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-blue-900">Livraison gratuite</span>
                    </div>
                    <p className="text-xs text-blue-700 ml-11">
                      Livraison à domicile sous 2-3 jours ouvrables
                    </p>
                  </div>

                  {/* Security Badge */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-green-900">Paiement sécurisé</span>
                    </div>
                    <p className="text-xs text-green-700 ml-11">
                      Vos données sont protégées par Stripe
                    </p>
                  </div>

                  {/* Trust Badges */}
                  <div className="flex justify-center gap-2 pt-2">
                    <div className="text-xs font-medium text-gray-400">VISA</div>
                    <div className="text-xs font-medium text-gray-400">MASTERCARD</div>
                    <div className="text-xs font-medium text-gray-400">AMEX</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </CheckoutGuard>
  );
}