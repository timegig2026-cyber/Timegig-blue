import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Trash2, CheckCircle, Zap, User, Loader2, Info } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { AppNotification } from '../types';

interface Props {
  userId: string;
}

export function AlertsView({ userId }: Props) {
  const { notifications, loading, clearNotifications } = useNotifications(userId);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleClearSelected = async () => {
    if (selectedIds.size === 0) return;
    await clearNotifications(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    await clearNotifications(notifications.map(n => n.id));
    setSelectedIds(new Set());
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="mt-4 text-gray-500 font-medium tracking-tight">Syncing your alerts...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Header */}
      <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-100 shadow-sm z-10">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">Your Alerts</h1>
            {notifications.length > 0 && (
              <div className="flex items-center gap-3">
                {selectedIds.size > 0 && (
                  <button 
                    onClick={handleClearSelected}
                    className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-100 transition-all active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear ({selectedIds.size})
                  </button>
                )}
                <button 
                  onClick={handleClearAll}
                  className="text-gray-400 hover:text-gray-600 text-xs font-bold transition-all"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 bg-teal-50 px-3 py-2 rounded-xl border border-teal-100">
            <Info className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <p className="text-[10px] text-teal-800 font-bold leading-tight uppercase tracking-wider">
              Real-time updates on new gigs and seekers in your area.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 px-6 pt-6">
        <div className="max-w-2xl mx-auto space-y-3">
          <AnimatePresence mode="popLayout">
            {notifications.map((notif) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => toggleSelection(notif.id)}
                className={`group cursor-pointer bg-white p-5 rounded-[1.5rem] border transition-all flex items-start gap-4 relative overflow-hidden ${
                  selectedIds.has(notif.id) 
                    ? 'border-teal-500 bg-teal-50/30 ring-2 ring-teal-500/10' 
                    : 'border-gray-100 hover:border-gray-200 shadow-sm'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 ${
                  notif.type === 'gig' ? 'bg-amber-100 text-amber-600' : 
                  notif.type === 'seeker' ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {notif.type === 'gig' ? <Zap className="w-6 h-6 fill-amber-600" /> : 
                   notif.type === 'seeker' ? <User className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight">{notif.title}</h3>
                    <span className="text-[10px] text-gray-400 font-bold">
                      {new Date(notif.timestamp?.toDate?.() || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                {selectedIds.has(notif.id) && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle className="w-5 h-5 text-teal-600 fill-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {notifications.length === 0 && (
            <div className="text-center py-24 space-y-4">
              <div className="w-20 h-20 bg-gray-100 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                <Bell className="w-8 h-8 text-gray-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Quiet for now</h3>
                <p className="text-sm text-gray-400 max-w-[200px] mx-auto">We'll notify you when new opportunities arrive.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
