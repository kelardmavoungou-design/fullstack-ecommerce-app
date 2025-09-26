import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { QrCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const QRScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        currentStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsStreaming(true);
        }
      } catch (err: any) {
        console.error('Camera error:', err);
        setStreamError("Impossible d'accéder à la caméra. Vous pouvez entrer le code manuellement.");
        setIsStreaming(false);
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleValidateCode = () => {
    if (!manualCode.trim()) {
      toast.error('Veuillez saisir un code');
      return;
    }
    toast.success(`Code scanné: ${manualCode}`);
    setManualCode('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Scanner un QR Code</h1>
        <p className="text-gray-600">Scannez le QR du colis ou saisissez le code manuellement</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Aperçu Caméra
            </CardTitle>
            <CardDescription>Placez le QR code au centre du cadre</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
              {streamError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 p-6 text-center">
                  <AlertCircle className="w-10 h-10 mb-3" />
                  <p className="mb-2">{streamError}</p>
                  <p className="text-sm text-gray-400">Autorisez l'accès à la caméra dans votre navigateur pour activer le scan.</p>
                </div>
              ) : (
                <>
                  <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                  {/* Overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-10 border-2 border-white/80 rounded-xl"></div>
                    <div className="absolute inset-0 bg-black/30"></div>
                    <div className="absolute inset-10 border-2 border-orange-500 rounded-xl mix-blend-screen animate-pulse"></div>
                  </div>
                </>
              )}
            </div>
            {!isStreaming && !streamError && (
              <div className="text-sm text-gray-500 mt-2">Initialisation de la caméra…</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entrée manuelle</CardTitle>
            <CardDescription>Utilisez cette option si le scan n'est pas possible</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manualCode">Code du colis</Label>
              <Input
                id="manualCode"
                placeholder="Ex: CMD12345-XYZ"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
              />
            </div>
            <Button onClick={handleValidateCode} className="w-full" style={{ backgroundColor: '#003333' }}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Valider le code
            </Button>
            <div className="text-xs text-gray-500">
              Astuce: Certains appareils requièrent l'activation de la caméra arrière dans les paramètres du navigateur.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QRScanner;
