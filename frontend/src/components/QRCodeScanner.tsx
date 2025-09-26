import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Camera, X } from 'lucide-react';

interface QRCodeScannerProps {
  onValidationSuccess: (data: any) => void;
  onValidationError: (error: string) => void;
  autoStart?: boolean;
}

export default function QRCodeScanner({ onValidationSuccess, onValidationError, autoStart = false }: QRCodeScannerProps) {
  console.log('QRCodeScanner rendu avec autoStart:', autoStart);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      // Nettoyer le stream et l'intervalle à la destruction du composant
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  // Démarrer la caméra automatiquement si autoStart est true
  useEffect(() => {
    console.log('useEffect autoStart déclenché, autoStart =', autoStart);
    if (autoStart) {
      console.log('Démarrage automatique de la caméra...');
      startCamera();
    }
  }, [autoStart]);

  const startCamera = async () => {
    if (isLoadingCamera) return; // Prevent multiple clicks

    console.log('Démarrage de la caméra...');
    setIsLoadingCamera(true);
    setCameraError("");
    try {
      // Essayer d'abord la caméra arrière, puis fallback sur caméra par défaut
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        console.log('Caméra arrière obtenue');
      } catch (envError) {
        console.log('Caméra arrière non disponible, tentative avec caméra par défaut');
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        console.log('Caméra par défaut obtenue');
      }
      console.log('Stream caméra obtenu:', stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);

        // Attendre que la vidéo soit prête
        videoRef.current.onloadedmetadata = async () => {
          console.log('Vidéo chargée, démarrage du scan');
          try {
            await videoRef.current!.play();
            setIsScanning(true);
            setIsLoadingCamera(false);
            // Démarrer la capture automatique des frames
            scanIntervalRef.current = setInterval(captureFrame, 500);
          } catch (playError) {
            console.error('Erreur lors du démarrage de la vidéo:', playError);
            setCameraError("Impossible de démarrer la vidéo");
            setIsLoadingCamera(false);
            onValidationError("Impossible de démarrer la vidéo");
          }
        };
      } else {
        console.error('Video element not found');
        setCameraError("Élément vidéo non trouvé");
        setIsLoadingCamera(false);
        onValidationError("Élément vidéo non trouvé");
      }
    } catch (error: any) {
      console.error('Erreur accès caméra:', error);
      setHasPermission(false);
      setIsLoadingCamera(false);
      let msg = "Impossible d'accéder à la caméra. ";
      if (window.isSecureContext === false) {
        msg += "L'accès à la caméra nécessite HTTPS ou localhost.";
      } else if (error && error.name === 'NotAllowedError') {
        msg += "Permission refusée. Autorisez la caméra dans votre navigateur.";
      } else if (error && error.name === 'NotFoundError') {
        msg += "Aucune caméra détectée sur cet appareil.";
      } else {
        msg += error.message || String(error);
      }
      setCameraError(msg);
      onValidationError(msg);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
    setIsLoadingCamera(false);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    // Détection réelle du QR code avec jsQR
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code && code.data) {
      try {
        // Essayer de parser comme JSON d'abord, sinon traiter comme code simple
        let qrData;
        try {
          qrData = JSON.parse(code.data);
        } catch (parseError) {
          // Si ce n'est pas du JSON, traiter comme code de validation simple
          qrData = {
            validationCode: code.data,
            type: 'simple_code'
          };
        }

        // On arrête la caméra et on valide
        stopCamera();
        onValidationSuccess({
          ...qrData,
          scannedAt: new Date().toISOString(),
          rawData: code.data
        });
      } catch (error) {
        console.error('Erreur traitement données QR:', error);
        // Fallback: traiter comme code simple
        stopCamera();
        onValidationSuccess({
          validationCode: code.data,
          timestamp: new Date().toISOString(),
          rawData: code.data
        });
      }
    }
  };

  // La simulation n'est plus utilisée, remplacée par jsQR

  const handleManualValidation = () => {
    // Validation manuelle pour les tests
    const mockQRData = {
      orderId: 123,
      validationCode: 'DEL123ABC',
      timestamp: new Date().toISOString(),
      location: {
        lat: 5.3167,
        lng: -4.0333
      }
    };

    onValidationSuccess(mockQRData);
  };

  if (hasPermission === false || cameraError) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Camera className="h-16 w-16 mx-auto text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Erreur caméra
          </h3>
          <p className="text-red-600 mb-4">
            {cameraError || "Veuillez autoriser l'accès à la caméra pour scanner le QR code."}
          </p>
          <Button onClick={() => { setHasPermission(null); setCameraError(""); }}>
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Scanner QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isScanning ? (
          <div className="text-center space-y-4">
            <QrCode className="h-24 w-24 mx-auto text-gray-400" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Validation de livraison
              </h3>
              <p className="text-gray-600 mb-4">
                Scannez le QR code du client pour valider la livraison.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={startCamera}
                disabled={isLoadingCamera}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                {isLoadingCamera ? 'Chargement...' : 'Ouvrir caméra'}
              </Button>
              <Button variant="outline" onClick={handleManualValidation}>
                Test manuel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 bg-black rounded-lg"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Overlay de ciblage */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white rounded-lg relative">
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-white"></div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 border-white"></div>
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l-2 border-b-2 border-white"></div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-white"></div>
                </div>
              </div>

              <Button
                onClick={stopCamera}
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Positionnez le QR code dans le cadre
              </p>
              <div className="flex justify-center">
                <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}