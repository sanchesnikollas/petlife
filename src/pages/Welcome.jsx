import { useState } from 'react';
import { PawPrint, Heart, Shield, Bell, ChevronRight, ArrowRight } from 'lucide-react';

const slides = [
  {
    icon: PawPrint,
    color: 'bg-primary',
    title: 'Tudo sobre seu pet\nem um só lugar',
    description: 'Prontuário completo, vacinas, alimentação e lembretes inteligentes para cuidar de quem você ama.',
  },
  {
    icon: Heart,
    color: 'bg-danger',
    title: 'Saúde sempre\nem dia',
    description: 'Nunca mais esqueça uma vacina ou medicação. O PetLife avisa quando é hora de cuidar.',
  },
  {
    icon: Shield,
    color: 'bg-primary-light',
    title: 'Histórico clínico\ncompleto',
    description: 'Registre consultas, exames e tratamentos. Tenha tudo na palma da mão para o veterinário.',
  },
];

export default function Welcome({ onContinue }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;

  const next = () => {
    if (isLast) {
      onContinue();
    } else {
      setCurrentSlide(currentSlide + 1);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-primary/5 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-56 h-56 rounded-full bg-accent/5 translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* Skip */}
      {!isLast && (
        <button
          onClick={onContinue}
          className="absolute top-12 right-6 text-sm font-medium text-text-secondary hover:text-primary z-10"
        >
          Pular
        </button>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        {/* Icon */}
        <div key={currentSlide} className="animate-scale-in">
          <div className={`w-28 h-28 rounded-[2rem] ${slide.color} flex items-center justify-center shadow-xl mb-10`}
               style={{ boxShadow: `0 20px 40px -10px ${slide.color === 'bg-primary' ? 'rgba(45,106,79,0.35)' : slide.color === 'bg-danger' ? 'rgba(230,57,70,0.3)' : 'rgba(82,183,136,0.3)'}` }}>
            <slide.icon size={48} className="text-white" />
          </div>
        </div>

        {/* Text */}
        <div key={`text-${currentSlide}`} className="animate-fade-in-up text-center">
          <h1 className="font-display text-3xl text-text-primary leading-tight whitespace-pre-line mb-4">
            {slide.title}
          </h1>
          <p className="text-text-secondary text-base leading-relaxed max-w-[280px] mx-auto">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Bottom */}
      <div className="px-8 pb-12">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={next}
          className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
        >
          {isLast ? (
            <>
              Começar agora
              <ArrowRight size={20} />
            </>
          ) : (
            <>
              Próximo
              <ChevronRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
