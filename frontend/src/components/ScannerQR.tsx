import React, { useState } from "react";
// @ts-ignore
import { QrReader } from "react-qr-reader";
import { Button } from "@/components/ui/button";

interface ScannerQRProps {
  onCodeScanned: (code: string) => void;
}

const ScannerQR: React.FC<ScannerQRProps> = ({ onCodeScanned }) => {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");

  const handleScan = (result: any) => {
    if (result?.text) {
      setScanning(false);
      onCodeScanned(result.text);
    }
  };

  const handleError = (err: any) => {
    setError("Erreur lors de la lecture du QR code");
    setScanning(false);
  };

  const handleManualSubmit = () => {
    if (manualCode.trim() !== "") {
      onCodeScanned(manualCode.trim());
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <h2 className="text-lg font-semibold mb-2">Scanner QR Code</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {scanning ? (
        <div className="w-full max-w-xs">
          <QrReader
            constraints={{ facingMode: "environment" }}
            onResult={handleScan}
            onError={handleError}
            style={{ width: "100%" }}
          />
          <Button className="mt-2 w-full" variant="secondary" onClick={() => setScanning(false)}>
            Annuler
          </Button>
        </div>
      ) : (
        <Button className="w-full" onClick={() => setScanning(true)}>
          Ouvrir caméra
        </Button>
      )}
      <div className="w-full flex flex-col items-center gap-2 mt-4">
        <span className="text-sm text-slate-600">Ou saisissez le code manuellement :</span>
        <input
          type="text"
          className="border rounded px-3 py-2 w-full max-w-xs"
          placeholder="Code de validation"
          value={manualCode}
          onChange={e => setManualCode(e.target.value)}
        />
        <Button className="w-full mt-1" variant="outline" onClick={handleManualSubmit}>
          Test manuel
        </Button>
      </div>
    </div>
  );
};

export default ScannerQR;
