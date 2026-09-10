import React, { useState } from 'react';
import { User, Image as ImageIcon } from 'lucide-react';

interface SafeImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackType?: 'user' | 'gig' | 'generic';
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = '',
  className = '',
  fallbackType = 'generic'
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || src.trim() === '' || hasError) {
    if (fallbackType === 'user') {
      return (
        <div className={`flex items-center justify-center bg-teal-100 text-teal-600 ${className}`}>
          <User className="w-1/2 h-1/2 opacity-75" />
        </div>
      );
    }
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-teal-500 to-emerald-700 text-white ${className}`}>
        <ImageIcon className="w-1/3 h-1/3 opacity-30" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
    />
  );
};
