import { StaticHeader } from "./components/StaticHeader";
import { StaticFilterBar } from "./components/StaticFilterBar";
import { StaticProductCard } from "./components/StaticProductCard";
import { StaticPageTitle } from "./components/StaticPageTitle";
import { Footer } from "./components/Footer";
import { Button } from "./components/ui/button";

const products = [
  {
    name: "CHAUSSETTE",
    price: "5.000 F CFA",
    image: "https://images.unsplash.com/photo-1598818432717-29f81b9224fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMGFua2xlJTIwc29ja3N8ZW58MXx8fHwxNzU1NTk0MjkyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    boutique: "ETS EAK"
  },
  {
    name: "MACHINE À LAVER",
    price: "250.000 F CFA",
    image: "https://images.unsplash.com/photo-1754732693535-7ffb5e1a51d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXNoaW5nJTIwbWFjaGluZSUyMGxhdW5kcnl8ZW58MXx8fHwxNzU1NTI1NzUxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    boutique: "Zoo Market"
  },
  {
    name: "FER À REPASSER",
    price: "25.000 F CFA",
    image: "https://images.unsplash.com/photo-1731339792557-47583fea380a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpcm9uJTIwY2xvdGhpbmclMjBhcHBsaWFuY2V8ZW58MXx8fHwxNzU1NTk0MjkzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    boutique: "Zoo Market"
  },
  {
    name: "PLAYSTATION 5",
    price: "450.000 F CFA",
    image: "https://images.unsplash.com/photo-1611138290962-2c550ffd4002?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBjb250cm9sbGVyfGVufDF8fHx8MTc1NTUyNDY5MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    boutique: "SuperSonic"
  },
  {
    name: "CLIMATISATION",
    price: "180.000 F CFA",
    image: "https://images.unsplash.com/photo-1647022528152-52ed9338611d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaXIlMjBjb25kaXRpb25pbmclMjB1bml0fGVufDF8fHx8MTc1NTU5NDI5NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    boutique: "Zoo Market"
  },
  {
    name: "VÉLO",
    price: "85.000 F CFA",
    image: "https://images.unsplash.com/photo-1667578608536-ba216bafb195?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaWN5Y2xlJTIwdmludGFnZXxlbnwxfHx8fDE3NTU1OTQyOTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    boutique: "Zoo Market"
  },
  {
    name: "ORDINATEUR PORTABLE",
    price: "320.000 F CFA",
    image: "https://images.unsplash.com/photo-1754928864131-21917af96dfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjBjb21wdXRlciUyMG1vZGVybnxlbnwxfHx8fDE3NTU1NDU1MzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    boutique: "Zoo Market"
  },
  {
    name: "MANETTE PS4",
    price: "35.000 F CFA",
    image: "https://images.unsplash.com/photo-1611138290962-2c550ffd4002?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBjb250cm9sbGVyfGVufDF8fHx8MTc1NTUyNDY5MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    boutique: "LA Playstation"
  },
  {
    name: "SAMSUNG GALAXY NOTE EDGE",
    price: "165.000 F CFA",
    image: "https://images.unsplash.com/photo-1698311427625-c9d99d089e54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW1zdW5nJTIwcGhvbmUlMjBtb2JpbGV8ZW58MXx8fHwxNzU1NTk0Mjk2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    boutique: "Zoo Market"
  },
  {
    name: "CASQUE AUDIO",
    price: "50.000 F CFA",
    image: "https://images.unsplash.com/photo-1752055833666-bfca5443136b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFkcGhvbmVzJTIwYXVkaW98ZW58MXx8fHwxNzU1NTcwNDAzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    boutique: "Zoo Market"
  },
  {
    name: "TABLETTE IPAD",
    price: "280.000 F CFA",
    image: "https://images.unsplash.com/photo-1627826436180-178c3b10767c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWJsZXQlMjBpcGFkJTIwZGV2aWNlfGVufDF8fHx8MTc1NTU3MjE2MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    boutique: "Zoo Market"
  },
  {
    name: "TV SMART",
    price: "350.000 F CFA",
    image: "https://images.unsplash.com/photo-1601944177325-f8867652837f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydCUyMHR2JTIwdGVsZXZpc2lvbnxlbnwxfHx8fDE3NTU0OTQzMTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    boutique: "Coshop"
  }
];

export default function FigmaDesign() {
  return (
    <div className="min-h-screen bg-gray-50">
      <StaticHeader />
      
      <main className="container mx-auto px-4 py-8">
        <StaticPageTitle />
        <StaticFilterBar />
        
        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {products.map((product, index) => (
            <StaticProductCard key={index} {...product} />
          ))}
        </div>
        
        {/* Load More Button */}
        <div className="flex justify-center">
          <Button variant="outline" className="px-8 py-2">
            Voir plus
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}