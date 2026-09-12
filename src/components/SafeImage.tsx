import React, { useState } from 'react';
import { User, Image as ImageIcon } from 'lucide-react';
import { getSafeImageUrl } from '../lib/imageUtils';

interface SafeImageProps {
  src?: string | null | any;
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

  const safeSrc = getSafeImageUrl(src);

  if (!safeSrc || hasError) {
    if (fallbackType === 'user') {
      return (
        <div className={`flex items-center justify-center bg-green-100 text-green-800 ${className}`}>
          <User className="w-1/2 h-1/2 opacity-75" />
        </div>
      );
    }
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-green-700 to-green-900 text-white ${className}`}>
        <ImageIcon className="w-1/3 h-1/3 opacity-30" />
      </div>
    );
  }

  return (
    <img
      src={safeSrc}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
    />
  );
};
