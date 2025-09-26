import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, CheckCircle, XCircle, RefreshCw, Smartphone } from "lucide-react";
import { useAuth } from "./AuthContext";
import QRCode from 'qrcode';

interface Order {
  id: number;
  delivery_code: string;
  status: string;
  buyer: {
    name: string;
    phone_number: string;
  };
  shop: {
    name: string;
  };
  total: number;
  shipping_address: string;
}

interface QRCodeValidationProps {
  order: Order;
  onValidationSuccess: (orderId: number) => void;
  onValidationError: (error: string) => void;
}

export default function QRCodeValidation({
  order,
  onValidationSuccess,
  onValidationError
}: QRCodeValidationProps) {
  // Note: Dans cette version, le QR code est présenté par le client
  // Le livreur scanne ce QR code ou saisit le code manuellement
  const { user } = useAuth();
  const [manualCode, setManualCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [qrData, setQrData] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Générer les données du QR code
  useEffect(() => {
    const generateQRCode = async () => {
      if (order) {
        const qrCodeData = {
          orderId: order.id,
          deliveryCode: order.delivery_code,
          deliveryPersonId: user?.id,
          timestamp: new Date().toISOString(),
          type: 'delivery_validation'
        };
        const dataString = JSON.stringify(qrCodeData);
        setQrData(dataString);

        try {
          // Générer le QR code en base64
          const qrCodeDataUrl = await QRCode.toDataURL(dataString, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          setQrCodeUrl(qrCodeDataUrl);
        } catch (error) {
          console.error('Erreur lors de la génération du QR code:', error);
        }
      }
    };

    generateQRCode();
  }, [order, user]);

  // Fonction pour valider manuellement le code
  const handleManualValidation = async () => {
    if (!manualCode.trim()) {
      onValidationError('Veuillez entrer un code de validation');
      return;
    }

    setIsValidating(true);
    setValidationStatus('idle');

    try {
      // Simuler une validation (remplacer par un appel API réel)
      if (manualCode === order.delivery_code) {
        setValidationStatus('success');
        setTimeout(() => {
          onValidationSuccess(order.id);
        }, 1500);
      } else {
        setValidationStatus('error');
        onValidationError('Code de validation incorrect');
      }
    } catch (error) {
      setValidationStatus('error');
      onValidationError('Erreur lors de la validation');
    } finally {
      setIsValidating(false);
    }
  };

  // Fonction pour régénérer le QR code
  const handleRegenerateQR = async () => {
    const newQrData = {
      orderId: order.id,
      deliveryCode: order.delivery_code,
      deliveryPersonId: user?.id,
      timestamp: new Date().toISOString(),
      type: 'delivery_validation'
    };
    const dataString = JSON.stringify(newQrData);
    setQrData(dataString);

    try {
      const qrCodeDataUrl = await QRCode.toDataURL(dataString, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Erreur lors de la régénération du QR code:', error);
    }
  };

  // Fonction pour simuler le scan du QR code
  const handleQRScan = () => {
    // Simuler un scan réussi
    setValidationStatus('success');
    setTimeout(() => {
      onValidationSuccess(order.id);
    }, 1500);
  };

  if (!order) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-slate-500">
            Aucune commande sélectionnée
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <QrCode className="h-5 w-5" />
          Validation de Livraison
        </CardTitle>
        <CardDescription>
          Commande #{order.id} - {order.shop.name}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Informations de la commande */}
        <div className="bg-slate-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Client:</span>
            <span className="text-sm">{order.buyer.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Téléphone:</span>
            <span className="text-sm">{order.buyer.phone_number}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Montant:</span>
            <Badge variant="secondary">{order.total}€</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Code de validation:</span>
            <Badge variant="outline" className="font-mono">
              {order.delivery_code}
            </Badge>
          </div>
        </div>

        {/* QR Code */}
        <div className="text-center space-y-4">
          <div className="bg-white p-4 rounded-lg border-2 border-dashed border-slate-300 inline-block">
            <div className="w-48 h-48 bg-slate-100 rounded-lg flex items-center justify-center">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="QR Code de validation"
                  className="w-full h-full rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <QrCode className="h-16 w-16 mx-auto text-slate-400 mb-2 animate-pulse" />
                  <p className="text-xs text-slate-500">Génération du QR Code...</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateQR}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Régénérer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleQRScan}
              className="text-xs"
            >
              <Smartphone className="h-3 w-3 mr-1" />
              Simuler Scan
            </Button>
          </div>
        </div>

        {/* Saisie manuelle du code */}
        <div className="space-y-3">
          <Label htmlFor="manual-code" className="text-sm font-medium">
            Ou saisissez le code manuellement :
          </Label>
          <div className="flex gap-2">
            <Input
              id="manual-code"
              type="text"
              placeholder="Entrez le code de validation"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1"
              maxLength={10}
            />
            <Button
              onClick={handleManualValidation}
              disabled={isValidating || !manualCode.trim()}
              size="sm"
            >
              {isValidating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Status de validation */}
        {validationStatus !== 'idle' && (
          <div className={`p-3 rounded-lg text-center ${
            validationStatus === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <div className="flex items-center justify-center gap-2">
              {validationStatus === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {validationStatus === 'success'
                  ? 'Validation réussie !'
                  : 'Code incorrect'
                }
              </span>
            </div>
          </div>
        )}

        {/* Données du QR code (pour debug) */}
        {process.env.NODE_ENV === 'development' && qrData && (
          <details className="text-xs">
            <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
              Données QR (debug)
            </summary>
            <pre className="mt-2 p-2 bg-slate-100 rounded text-xs overflow-x-auto">
              {JSON.stringify(JSON.parse(qrData), null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}