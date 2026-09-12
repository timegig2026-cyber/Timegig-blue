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
        <Loader2 className="w-8 h-8 text-green-800 animate-spin" />
        <p className="mt-4 text-gray-500 font-medium tracking-tight">Syncing your alerts...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Header */}
      <div className="bg-white px-4 pt-3 pb-2.5 border-b border-gray-100 shadow-xs z-10">
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-black text-gray-900 tracking-tight uppercase">Your Alerts</h1>
            {notifications.length > 0 && (
              <div className="flex items-center gap-2">
                {selectedIds.size > 0 && (
                  <button 
                    onClick={handleClearSelected}
                    title={`Clear Selected (${selectedIds.size})`}
                    aria-label={`Clear Selected (${selectedIds.size})`}
                    className="relative bg-red-50 text-red-600 p-1.5 rounded-lg hover:bg-red-100 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-xs">
                      {selectedIds.size}
                    </span>
                  </button>
                )}
                <button 
                  onClick={handleClearAll}
                  title="Clear All"
                  aria-label="Clear All"
                  className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 transition-all cursor-pointer flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-100">
            <Info className="w-3.5 h-3.5 text-green-800 flex-shrink-0" />
            <p className="text-[9px] text-green-950 font-bold leading-tight uppercase tracking-wider">
              Real-time updates on new gigs and seekers in your area.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20 px-4 pt-3.5">
        <div className="max-w-2xl mx-auto space-y-2">
          <AnimatePresence mode="popLayout">
            {notifications.map((notif) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => toggleSelection(notif.id)}
                className={`group cursor-pointer bg-white p-3 rounded-xl border transition-all flex items-start gap-3 relative overflow-hidden ${
                  selectedIds.has(notif.id) 
                    ? 'border-green-700 bg-green-50/30 ring-2 ring-green-700/10' 
                    : 'border-gray-100 hover:border-gray-200 shadow-xs'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 ${
                  notif.type === 'gig' ? 'bg-amber-100 text-amber-600' : 
                  notif.type === 'seeker' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {notif.type === 'gig' ? <Zap className="w-4 h-4 fill-amber-600" /> : 
                   notif.type === 'seeker' ? <User className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                </div>

                <div className="flex-1 space-y-0.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-xs leading-tight truncate">{notif.title}</h3>
                    <span className="text-[9px] text-gray-400 font-medium ml-2 flex-shrink-0">
                      {new Date(notif.timestamp?.toDate?.() || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                {selectedIds.has(notif.id) && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="w-4 h-4 text-green-800 fill-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {notifications.length === 0 && (
            <div className="text-center py-14 space-y-2">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2 border border-dashed border-gray-200">
                <Bell className="w-5 h-5 text-gray-300" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-800">Quiet for now</h3>
                <p className="text-[11px] text-gray-400 max-w-[200px] mx-auto">We'll notify you when new opportunities arrive.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
