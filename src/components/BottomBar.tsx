import { User, Briefcase, Bell, Search, Settings, Zap } from 'lucide-react';
import { ThreeDIcon } from './ThreeDIcon';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomBar({ activeTab, onTabChange }: Props) {
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'seekers', label: 'Seekers', icon: Search },
    { id: 'gigs', label: 'GiGs', icon: Zap, isProminent: true },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/60 pb-3 pt-2 px-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50">
      <div className="flex justify-between items-center max-w-md mx-auto h-12 px-2">
        {tabs.map((tab) => (
          <ThreeDIcon
            key={tab.id}
            icon={tab.icon as any}
            label={tab.label}
            isActive={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            isProminent={tab.isProminent}
          />
        ))}
      </div>
    </div>
  );
}
