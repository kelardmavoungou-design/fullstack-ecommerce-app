import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { adService, Ad } from "../services/adService";
import { useAuth } from "./AuthContext";
import { ExternalLink, Eye } from "lucide-react";

interface AdDisplayProps {
  placement: 'home' | 'sidebar' | 'product_page' | 'search_results' | 'category_page';
  className?: string;
  showFallback?: boolean;
  categories?: string[];
  location?: string;
}

export function AdDisplay({
  placement,
  className = "",
  showFallback = true,
  categories = [],
  location
}: AdDisplayProps) {
  const { user } = useAuth();
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAd();
  }, [placement, user, categories, location]);

  const loadAd = async () => {
    try {
      setLoading(true);
      setError(null);

      const userContext = {
        userId: user?.id ? parseInt(user.id) : undefined,
        categories,
        location,
        // age pourrait être ajouté plus tard si disponible dans le profil utilisateur
      };

      const adData = await adService.getAd(placement, userContext);
      setAd(adData);
    } catch (err) {
      console.error('Erreur lors du chargement de la publicité:', err);
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAdClick = async () => {
    if (!ad) return;

    try {
      const isValidClick = await adService.trackClick(ad.campaign_id, ad.id, user?.id ? parseInt(user.id) : undefined);

      if (isValidClick) {
        // Ouvrir l'URL cible dans un nouvel onglet
        window.open(ad.target_url, '_blank', 'noopener,noreferrer');
      } else {
        // Clic suspect détecté
        console.warn('Clic suspect détecté, redirection annulée');
      }
    } catch (err) {
      console.error('Erreur lors du traitement du clic:', err);
      // En cas d'erreur, ouvrir quand même l'URL
      window.open(ad.target_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded mb-3"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !ad) {
    if (!showFallback) return null;

    return (
      <Card className={`overflow-hidden ${className}`}>
        <CardContent className="p-4 text-center">
          <Eye className="h-8 w-8 text-somba-text-light mx-auto mb-2" />
          <p className="text-sm text-somba-text-light">
            {error || 'Aucune publicité disponible'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${className}`}>
      <CardContent className="p-0">
        {/* Image de la publicité */}
        {ad.image && (
          <div className="relative h-32 overflow-hidden">
            <ImageWithFallback
              src={ad.image}
              alt={ad.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2">
              <span className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                PUB
              </span>
            </div>
          </div>
        )}

        {/* Contenu de la publicité */}
        <div className="p-4" onClick={handleAdClick}>
          <h3 className="font-semibold text-somba-primary mb-2 line-clamp-2">
            {ad.title}
          </h3>
          <p className="text-sm text-somba-text-light mb-3 line-clamp-3">
            {ad.content}
          </p>

          {/* Bouton d'action */}
          <Button
            size="sm"
            className="w-full bg-somba-accent hover:bg-somba-accent/90"
            onClick={(e) => {
              e.stopPropagation();
              handleAdClick();
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            En savoir plus
          </Button>
        </div>

        {/* Indicateur de publicité */}
        <div className="px-4 pb-2">
          <p className="text-xs text-somba-text-light text-center">
            Publicité sponsorisée
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant pour afficher plusieurs publicités
interface AdCarouselProps {
  placement: 'home' | 'sidebar' | 'product_page' | 'search_results' | 'category_page';
  limit?: number;
  className?: string;
  categories?: string[];
  location?: string;
}

export function AdCarousel({
  placement,
  limit = 3,
  className = "",
  categories = [],
  location
}: AdCarouselProps) {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAds();
  }, [placement, user, limit, categories, location]);

  const loadAds = async () => {
    try {
      setLoading(true);
      const adsData = await adService.getAds(placement, limit, user?.id ? parseInt(user.id) : undefined);
      setAds(adsData);
    } catch (err) {
      console.error('Erreur lors du chargement des publicités:', err);
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 gap-4 ${className}`}>
        {Array.from({ length: limit }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-24 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (ads.length === 0) {
    return null;
  }

  return (
    <div className={`grid grid-cols-1 gap-4 ${className}`}>
      {ads.map((ad) => (
        <AdDisplay
          key={`${ad.campaign_id}-${ad.id}`}
          placement={placement}
          showFallback={false}
          categories={categories}
          location={location}
        />
      ))}
    </div>
  );
}