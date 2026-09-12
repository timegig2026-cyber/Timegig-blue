import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  key?: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isProminent?: boolean;
}

export function ThreeDIcon({ icon: Icon, label, isActive, onClick, isProminent }: Props) {
  const iconSize = isProminent ? 22 : 20;

  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center outline-none cursor-pointer py-1 px-2 rounded-2xl transition-all ${
        isProminent ? '-translate-y-1' : ''
      }`}
      aria-label={label}
      title={label}
    >
      <div className={`relative flex items-center justify-center ${isProminent ? 'w-11 h-11 rounded-2xl bg-green-800 text-white shadow-md' : 'w-10 h-10'}`}>
        {isProminent && isActive && (
          <motion.div
            layoutId="active-glow"
            className="absolute inset-0 rounded-2xl bg-green-700 opacity-40 blur-xs"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
        <Icon
          size={iconSize}
          strokeWidth={isActive ? 2.5 : 2.0}
          className={`relative z-10 transition-colors duration-200 ${
            isProminent
              ? 'text-white'
              : isActive
              ? 'text-green-800'
              : 'text-gray-400 group-hover:text-gray-600'
          }`}
        />
      </div>

      <span className={`text-[10px] font-bold tracking-tight transition-colors ${
        isActive && !isProminent ? 'text-green-900 font-extrabold' : 'text-gray-500'
      }`}>
        {label}
      </span>
    </button>
  );
}
