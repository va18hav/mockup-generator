import React from 'react';

interface SelectionCardProps {
  id: string;
  title: string;
  image: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  multiSelectIndex?: number;
  compact?: boolean;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({ 
  title, 
  image, 
  description, 
  selected, 
  onClick,
  multiSelectIndex,
  compact = false
}) => {
  return (
    <div 
      onClick={onClick}
      className={`relative group cursor-pointer rounded-xl overflow-hidden transition-all duration-300 flex flex-col h-full w-full
        ${selected 
          ? 'ring-2 ring-brand-400 shadow-[0_0_15px_rgba(139,92,246,0.4)] scale-[1.02] bg-white/10' 
          : 'ring-1 ring-white/10 hover:ring-white/30 hover:bg-white/5 bg-white/5 hover:scale-[1.02]'
        }
      `}
    >
      {/* Image Container - Portrait Aspect Ratio for Fashion/Premium look */}
      <div className="aspect-[3/4] w-full overflow-hidden relative">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
        
        {/* Selection Indicator */}
        {selected && (
          <div className="absolute top-2 right-2 bg-brand-500 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-lg animate-fade-in z-10">
             {multiSelectIndex !== undefined ? (
                <span className="text-[10px] font-bold">{multiSelectIndex}</span>
             ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
             )}
          </div>
        )}

        {/* Text Overlay for Compact Look */}
        <div className="absolute bottom-0 left-0 right-0 p-3 pt-8 bg-gradient-to-t from-black/90 to-transparent">
          <h3 className={`font-serif text-sm font-bold leading-tight ${selected ? 'text-brand-200' : 'text-gray-100'}`}>
            {title}
          </h3>
        </div>
      </div>

      {/* Description - Only visible if not extremely compact, or separate visually */}
      <div className="px-3 py-2 bg-white/5 flex-1 border-t border-white/5">
        <p className="text-[10px] text-gray-400 leading-snug line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  );
};