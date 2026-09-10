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
  const isAlerts = label === 'Alerts';
  const containerSize = isProminent ? 'h-11 w-11' : (isAlerts ? 'h-7 w-7' : 'h-8 w-8');
  const iconSize = isProminent ? 22 : (isAlerts ? 14 : 16);
  const borderRadius = isProminent ? 'rounded-xl' : 'rounded-lg';

  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center gap-0.5 outline-none ${isProminent ? 'w-14 -translate-y-2' : 'w-12'}`}
      aria-label={label}
    >
      <div className={`relative ${containerSize}`}>
        {/* The 3D Button element */}
        <div
          className={`
            absolute inset-0 mx-auto ${containerSize} ${borderRadius}
            transition-all duration-200 ease-out
            group-active:translate-y-[2px]
            ${isActive
              ? 'bg-gradient-to-b from-teal-400 to-teal-600 shadow-[0px_3px_0px_0px_#134e4a,0px_6px_10px_0px_rgba(20,184,166,0.5),inset_0px_1px_0px_0px_rgba(255,255,255,0.4)] group-active:shadow-[0px_1px_0px_0px_#134e4a,0px_2px_5px_0px_rgba(20,184,166,0.5),inset_0px_1px_0px_0px_rgba(255,255,255,0.4)]'
              : 'bg-gradient-to-b from-white to-gray-100 shadow-[0px_3px_0px_0px_#cbd5e1,0px_6px_10px_0px_rgba(0,0,0,0.08),inset_0px_1px_0px_0px_rgba(255,255,255,1)] group-active:shadow-[0px_1px_0px_0px_#cbd5e1,0px_2px_5px_0px_rgba(0,0,0,0.08),inset_0px_1px_0px_0px_rgba(255,255,255,1)] hover:to-gray-50'
            }
          `}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            {isActive && (
              <motion.div
                layoutId="active-glow"
                className={`absolute inset-0 ${borderRadius} bg-teal-400 opacity-30 blur-sm`}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <Icon
              size={iconSize}
              strokeWidth={isActive ? 2.5 : 2.2}
              className={`relative z-10 transition-colors duration-300 drop-shadow-sm ${
                isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
              }`}
            />
          </div>
        </div>
      </div>

      <span
        className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${
          isActive ? 'text-teal-700' : 'text-gray-400 group-hover:text-gray-600'
        } ${isProminent ? 'mt-1' : ''}`}
      >
        {label}
      </span>
    </button>
  );
}
