import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import sellerService from "../services/sellerService";
import { Wallet, ArrowUpRight, AlertCircle, CheckCircle, Clock, DollarSign, Loader2 } from "lucide-react";

interface BankAccount {
  provider: string;
  account: string;
  verified: boolean;
}

export function WithdrawalManagement() {
  const { user } = useAuth();
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [amount, setAmount] = useState('');

  // Charger les données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger le profil vendeur pour obtenir le solde du portefeuille
      const profileResponse = await sellerService.getSellerProfile();
      if (profileResponse.success && profileResponse.data?.profile) {
        setWalletBalance(profileResponse.data.profile.walletBalance || 0);
      }

      // Charger les informations bancaires
      const bankResponse = await sellerService.getBankAccount();
      if (bankResponse.success && bankResponse.data?.bankAccount) {
        setBankAccount(bankResponse.data.bankAccount);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawal = async () => {
    const withdrawalAmount = parseFloat(amount);

    if (!withdrawalAmount || withdrawalAmount <= 0) {
      toast.error("Veuillez saisir un montant valide");
      return;
    }

    if (withdrawalAmount > walletBalance) {
      toast.error("Solde insuffisant");
      return;
    }

    if (withdrawalAmount < 5000) {
      toast.error("Le montant minimum de retrait est de 5 000 FCFA");
      return;
    }

    if (!bankAccount || !bankAccount.verified) {
      toast.error("Votre compte bancaire doit être configuré et vérifié");
      return;
    }

    try {
      setWithdrawing(true);
      const response = await sellerService.processWithdrawal(withdrawalAmount);

      if (response.success) {
        toast.success("Retrait initié avec succès !", {
          description: `Le montant sera envoyé à votre compte ${bankAccount.provider}`
        });
        setAmount('');
        // Recharger le solde depuis le backend
        await loadData();
      } else {
        toast.error(response.error || "Erreur lors du retrait");
      }
    } catch (error) {
      console.error('Erreur lors du retrait:', error);
      toast.error("Erreur lors du retrait");
    } finally {
      setWithdrawing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    });
  };

  const getProviderInfo = (provider: string) => {
    const providers: Record<string, { label: string; icon: string }> = {
      mtn_money: { label: 'MTN Mobile Money', icon: '🟡' }
    };
    return providers[provider] || { label: provider, icon: '🏦' };
  };

  const calculateFees = (amount: number) => {
    const fee = 0; // No commission on withdrawal
    const netAmount = amount - fee;
    return { fee, netAmount };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Chargement...</span>
      </div>
    );
  }

  const withdrawalAmount = parseFloat(amount) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Retraits</h2>
        <p className="text-gray-600">
          Retirez vos gains vers votre compte mobile money gratuitement.
        </p>
      </div>

      {/* Solde du portefeuille */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Solde du portefeuille
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600 mb-2">
            {formatCurrency(walletBalance)}
          </div>
          <p className="text-sm text-gray-600">
            Disponible pour retrait
          </p>
        </CardContent>
      </Card>

      {/* État du compte bancaire */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Compte bancaire
          </CardTitle>
          <CardDescription>
            Informations de votre compte de retrait
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bankAccount ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getProviderInfo(bankAccount.provider).icon}</span>
                  <span className="font-medium">{getProviderInfo(bankAccount.provider).label}</span>
                </div>
                <Badge variant={bankAccount.verified ? "default" : "secondary"}>
                  {bankAccount.verified ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Vérifié
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Non vérifié
                    </>
                  )}
                </Badge>
              </div>

              <div className="text-sm text-gray-600">
                <div>Numéro: <span className="font-mono">{bankAccount.account}</span></div>
              </div>

              {!bankAccount.verified && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Compte non vérifié
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Vous devez vérifier votre compte bancaire avant de pouvoir effectuer des retraits.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Aucun compte bancaire configuré</p>
              <p className="text-sm text-gray-400">
                Configurez votre compte bancaire dans les paramètres pour pouvoir effectuer des retraits.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulaire de retrait */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5" />
            Effectuer un retrait
          </CardTitle>
          <CardDescription>
            Retirez vos fonds vers votre compte mobile money
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Montant à retirer (FCFA)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Ex: 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="5000"
              max={walletBalance}
            />
            <p className="text-xs text-gray-500">
              Minimum: 5 000 FCFA • Maximum: {formatCurrency(walletBalance)}
            </p>
          </div>

          {/* Résumé du retrait */}
          {withdrawalAmount > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-800">Montant à recevoir:</span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(withdrawalAmount)}</span>
              </div>
              <p className="text-xs text-green-700 mt-1">Retrait 100% gratuit et instantané</p>
            </div>
          )}

          <Button
            onClick={handleWithdrawal}
            disabled={withdrawing || !bankAccount?.verified || withdrawalAmount < 5000 || withdrawalAmount > walletBalance}
            className="w-full bg-somba-primary hover:bg-somba-primary/90"
            size="lg"
          >
            {withdrawing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Traitement en cours...
              </>
            ) : (
              <>
                <ArrowUpRight className="h-5 w-5 mr-2" />
                Retirer {withdrawalAmount > 0 ? formatCurrency(withdrawalAmount) : ''}
              </>
            )}
          </Button>

          {/* Messages d'aide */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Les retraits sont gratuits et instantanés</p>
            <p>• Le montant arrive généralement dans les 5-10 minutes</p>
            <p>• En cas de problème, contactez le support</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}