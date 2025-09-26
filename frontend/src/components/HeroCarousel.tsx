import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  image: string;
}

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: HeroSlide[] = [
    {
      id: 1,
      title: "OBTENEZ",
      subtitle: "20% DE",
      description: "RÉDUCTION",
      buttonText: "DÉCOUVRIR",
      image: "https://images.unsplash.com/photo-1740377016263-88f2bec96f75?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaG9wcGluZyUyMHByb21vdGlvbiUyMGJhbm5lcnxlbnwxfHx8fDE3NTU1NzMwMjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      id: 2,
      title: "NOUVELLE",
      subtitle: "COLLECTION",
      description: "ÉLECTRONIQUE",
      buttonText: "EXPLORER",
      image: "https://images.unsplash.com/photo-1643365944732-2b004f0c37d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWxlJTIwZGlzY291bnQlMjBzaG9wcGluZ3xlbnwxfHx8fDE3NTU2ODQzNTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      id: 3,
      title: "LIVRAISON",
      subtitle: "GRATUITE",
      description: "TOUTE COMMANDE",
      buttonText: "COMMANDER",
      image: "https://images.unsplash.com/photo-1604532081136-b157aa1729e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMGZyaWRheSUyMHNhbGV8ZW58MXx8fHwxNzU1Njg0MzUwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    }
  ];

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative h-96 md:h-[500px] overflow-hidden bg-somba-primary">
      {/* Slides */}
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="w-full h-full flex-shrink-0 relative"
          >
            {/* Image Background */}
            <div className="absolute inset-0">
              <ImageWithFallback
                src={slide.image}
                alt={`${slide.title} ${slide.subtitle}`}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-somba-primary/80 via-somba-primary/40 to-transparent"></div>
            
            {/* Content */}
            <div className="relative container mx-auto px-4 h-full flex items-center">
              <div className="text-white max-w-lg">
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-6xl font-bold text-white">
                    {slide.title}
                  </h1>
                  <h2 className="text-3xl md:text-5xl font-bold text-somba-accent">
                    {slide.subtitle}
                  </h2>
                  <h3 className="text-2xl md:text-4xl font-bold text-white mb-6">
                    {slide.description}
                  </h3>
                  <Button className="bg-somba-accent hover:bg-somba-accent/90 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all">
                    {slide.buttonText}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-somba-accent/20 hover:bg-somba-accent/40 text-white p-3 rounded-full transition-all backdrop-blur-sm border border-white/20 hover:border-somba-accent"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-somba-accent/20 hover:bg-somba-accent/40 text-white p-3 rounded-full transition-all backdrop-blur-sm border border-white/20 hover:border-somba-accent"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide 
                ? 'bg-somba-accent shadow-lg scale-125' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}