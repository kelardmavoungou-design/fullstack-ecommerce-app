import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import sellerService from "../services/sellerService";
import { CreditCard, CheckCircle, AlertCircle, Smartphone, Loader2 } from "lucide-react";

interface BankAccount {
  provider: string;
  account: string;
  verified: boolean;
}

export function BankAccountSettings() {
  const { user } = useAuth();
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    bank_provider: '',
    bank_account: ''
  });

  const bankProviders = [
    { value: 'mtn_money', label: 'MTN Mobile Money', icon: '🟡' }
  ];

  // Charger les informations bancaires
  useEffect(() => {
    loadBankAccount();
  }, []);

  const loadBankAccount = async () => {
    try {
      setLoading(true);
      const response = await sellerService.getBankAccount();

      if (response.success && response.data?.bankAccount) {
        setBankAccount(response.data.bankAccount);
        setFormData({
          bank_provider: response.data.bankAccount.provider || '',
          bank_account: response.data.bankAccount.account || ''
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement du compte bancaire:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.bank_provider || !formData.bank_account) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      setSaving(true);
      const response = await sellerService.updateBankAccount(formData);

      if (response.success) {
        toast.success("Informations bancaires mises à jour avec succès");
        await loadBankAccount(); // Recharger les données
      } else {
        toast.error(response.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    try {
      setVerifying(true);
      const response = await sellerService.verifyBankAccount();

      if (response.success) {
        toast.success("Compte bancaire vérifié avec succès");
        await loadBankAccount(); // Recharger les données
      } else {
        toast.error(response.error || "Erreur lors de la vérification");
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      toast.error("Erreur lors de la vérification");
    } finally {
      setVerifying(false);
    }
  };

  const getProviderInfo = (provider: string) => {
    return bankProviders.find(p => p.value === provider);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Paramètres bancaires</h2>
        <p className="text-gray-600">
          Configurez votre compte bancaire pour recevoir vos retraits. Tous les champs sont obligatoires.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Informations du compte bancaire
          </CardTitle>
          <CardDescription>
            Ces informations sont nécessaires pour effectuer des retraits vers votre compte mobile money.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Affichage du compte actuel */}
          {bankAccount && bankAccount.provider && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Compte configuré</h3>
                <Badge variant={bankAccount.verified ? "default" : "secondary"} className="flex items-center gap-1">
                  {bankAccount.verified ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Vérifié
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3" />
                      Non vérifié
                    </>
                  )}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Fournisseur:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span>{getProviderInfo(bankAccount.provider)?.icon}</span>
                    <span>{getProviderInfo(bankAccount.provider)?.label}</span>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Numéro:</span>
                  <div className="mt-1 font-mono">{bankAccount.account}</div>
                </div>
              </div>

              {!bankAccount.verified && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-amber-600 mb-3">
                    Votre compte n'est pas encore vérifié. Une petite transaction de test sera effectuée pour vérifier votre compte.
                  </p>
                  <Button
                    onClick={handleVerify}
                    disabled={verifying}
                    variant="outline"
                    size="sm"
                    className="border-amber-500 text-amber-600 hover:bg-amber-50"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Vérification en cours...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Vérifier le compte
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Formulaire de configuration */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_provider">Fournisseur bancaire *</Label>
                <Select
                  value={formData.bank_provider}
                  onValueChange={(value) => handleInputChange('bank_provider', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisissez un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankProviders.map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        <div className="flex items-center gap-2">
                          <span>{provider.icon}</span>
                          <span>{provider.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account">Numéro de téléphone *</Label>
                <Input
                  id="bank_account"
                  type="tel"
                  placeholder="Ex: 0700000000"
                  value={formData.bank_account}
                  onChange={(e) => handleInputChange('bank_account', e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Numéro associé à votre compte mobile money
                </p>
              </div>
            </div>


            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-somba-primary hover:bg-somba-primary/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Informations importantes */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Informations importantes</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Assurez-vous que le numéro de téléphone correspond à votre compte mobile money</li>
                  <li>• Une vérification sera nécessaire avant de pouvoir effectuer des retraits</li>
                  <li>• Les retraits sont gratuits et instantanés</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}