interface Ad {
  id: number;
  campaign_id: number;
  title: string;
  content: string;
  image?: string;
  target_url: string;
  placement: string;
}

interface AdResponse {
  ad: Ad | null;
  message?: string;
}

interface AdsResponse {
  ads: Ad[];
}

class AdService {
  private baseUrl = 'http://localhost:4000/api/ad-campaigns';

  // Récupérer une publicité pour un emplacement
  async getAd(placement: string, userContext?: {
    userId?: number;
    categories?: string[];
    location?: string;
    age?: number;
  }): Promise<Ad | null> {
    try {
      const params = new URLSearchParams();
      params.append('placement', placement);

      if (userContext?.userId) {
        params.append('user_id', userContext.userId.toString());
      }
      if (userContext?.categories && userContext.categories.length > 0) {
        params.append('categories', userContext.categories.join(','));
      }
      if (userContext?.location) {
        params.append('location', userContext.location);
      }
      if (userContext?.age) {
        params.append('age', userContext.age.toString());
      }

      const response = await fetch(`${this.baseUrl}/serve?${params.toString()}`);

      if (!response.ok) {
        console.error('Erreur lors de la récupération de la publicité');
        return null;
      }

      const data: AdResponse = await response.json();
      return data.ad;
    } catch (error) {
      console.error('Erreur lors de la récupération de la publicité:', error);
      return null;
    }
  }

  // Récupérer plusieurs publicités
  async getAds(placement: string, limit: number = 3, userId?: number): Promise<Ad[]> {
    try {
      const params = new URLSearchParams();
      params.append('placement', placement);
      params.append('limit', limit.toString());

      if (userId) {
        params.append('user_id', userId.toString());
      }

      const response = await fetch(`${this.baseUrl}/serve/multiple?${params.toString()}`);

      if (!response.ok) {
        console.error('Erreur lors de la récupération des publicités');
        return [];
      }

      const data: AdsResponse = await response.json();
      return data.ads || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des publicités:', error);
      return [];
    }
  }

  // Enregistrer un clic sur une publicité
  async trackClick(campaignId: number, adId: number, userId?: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/track/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          ad_id: adId,
          user_id: userId,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent,
          placement: 'home' // Valid enum value for ad_placement
        })
      });

      if (!response.ok) {
        console.error('Erreur lors de l\'enregistrement du clic');
        return false;
      }

      const data = await response.json();

      // Rediriger vers l'URL cible si le clic est valide
      if (data.is_suspicious === false) {
        // La redirection sera gérée par le composant appelant
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du clic:', error);
      return false;
    }
  }

  // Obtenir l'adresse IP du client (approximative)
  private async getClientIP(): Promise<string> {
    try {
      // Cette méthode n'est pas parfaite mais donne une approximation
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      // Fallback à une valeur par défaut
      return '127.0.0.1';
    }
  }
}

export const adService = new AdService();
export type { Ad };