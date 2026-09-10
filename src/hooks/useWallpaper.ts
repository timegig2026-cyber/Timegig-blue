import { useState, useEffect } from 'react';
import { db, doc, onSnapshot } from '../lib/firebase';

export function useWallpaper() {
  const [wallpaper, setWallpaper] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'appearance'), (docSnap) => {
      if (docSnap.exists()) {
        setWallpaper(docSnap.data().wallpaper || null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Wallpaper Listener Error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { wallpaper, loading };
}
