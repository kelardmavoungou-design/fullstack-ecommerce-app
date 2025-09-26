import React from 'react';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, CreditCard, Truck, Shield, Headphones } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function Footer() {
  return (
    <footer className="bg-somba-primary text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-somba-accent">SOMBA</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Votre plateforme e-commerce de confiance en Côte d'Ivoire. 
              Découvrez des milliers de produits de qualité dans nos boutiques partenaires.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="sm" className="text-white hover:text-somba-accent hover:bg-white/10 p-2">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:text-somba-accent hover:bg-white/10 p-2">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:text-somba-accent hover:bg-white/10 p-2">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:text-somba-accent hover:bg-white/10 p-2">
                <Youtube className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Navigation Rapide</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-300 hover:text-somba-accent transition-colors">
                  Accueil
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-somba-accent transition-colors">
                  Boutiques
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-somba-accent transition-colors">
                  Catalogue
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-somba-accent transition-colors">
                  Promotions
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-somba-accent transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Service Client</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-300 hover:text-somba-accent transition-colors">
                  Mon Compte
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-somba-accent transition-colors">
                  Mes Commandes
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-somba-accent transition-colors">
                  Retours & Remboursements
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-somba-accent transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-somba-accent transition-colors">
                  Support 24/7
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Restez Connecté</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Phone className="h-4 w-4 text-somba-accent" />
                <span>+225 01 02 03 04 05</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Mail className="h-4 w-4 text-somba-accent" />
                <span>contact@somba.ci</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <MapPin className="h-4 w-4 text-somba-accent" />
                <span>Abidjan, Côte d'Ivoire</span>
              </div>
            </div>
            
            <div className="mt-6">
              <h5 className="font-medium mb-2">Newsletter</h5>
              <div className="flex">
                <Input 
                  placeholder="Votre email" 
                  className="rounded-r-none border-gray-600 bg-white/10 text-white placeholder:text-gray-400 focus:border-somba-accent"
                />
                <Button className="rounded-l-none bg-somba-accent hover:bg-somba-accent/90 px-4">
                  OK
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-somba-accent" />
              <div className="text-sm">
                <div className="font-medium">Livraison Rapide</div>
                <div className="text-gray-400 text-xs">24h à Abidjan</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-somba-accent" />
              <div className="text-sm">
                <div className="font-medium">Paiement Sécurisé</div>
                <div className="text-gray-400 text-xs">100% Sécurisé</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Headphones className="h-5 w-5 text-somba-accent" />
              <div className="text-sm">
                <div className="font-medium">Support 24/7</div>
                <div className="text-gray-400 text-xs">Assistance dédiée</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-somba-accent" />
              <div className="text-sm">
                <div className="font-medium">Mobile Money</div>
                <div className="text-gray-400 text-xs">Orange, MTN, Moov</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="text-sm text-gray-400">
              © 2024 SOMBA. Tous droits réservés.
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-somba-accent transition-colors">
                Conditions d'utilisation
              </a>
              <a href="#" className="text-gray-400 hover:text-somba-accent transition-colors">
                Politique de confidentialité
              </a>
              <a href="#" className="text-gray-400 hover:text-somba-accent transition-colors">
                Mentions légales
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}