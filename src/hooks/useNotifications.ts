import { useState, useEffect, useRef } from 'react';
import { db, collection, query, onSnapshot, where, orderBy, deleteDoc, doc, addDoc, serverTimestamp, getDocs, limit } from '../lib/firebase';
import { AppNotification } from '../types';
import { playNotificationSound } from '../lib/soundUtils';

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    isInitialLoad.current = true;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppNotification[];
      
      if (!isInitialLoad.current) {
        let hasNew = false;
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') hasNew = true;
        });
        if (hasNew) {
          playNotificationSound();
        }
      }

      setNotifications(data);
      setLoading(false);
      isInitialLoad.current = false;
    }, (error) => {
      console.error("Error fetching notifications:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const clearNotifications = async (ids: string[]) => {
    try {
      const deletePromises = ids.map(id => deleteDoc(doc(db, 'notifications', id)));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  // Logic to simulate "receiving" new notifications for demo purposes
  // This listens for new gigs and seekers and adds a notification if none exists for this user/relatedId
  useEffect(() => {
    if (!userId) return;

    // Listen for new gigs
    const gigsUnsub = onSnapshot(collection(db, 'gigs'), async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const gig = change.doc.data();
          const gigId = change.doc.id;
          
          // Check if we already notified for this
          const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId),
            where('relatedId', '==', gigId),
            limit(1)
          );
          const existing = await getDocs(q);
          
          if (existing.empty && gig.ownerId !== userId) {
            await addDoc(collection(db, 'notifications'), {
              userId,
              type: 'gig',
              title: 'New GiG Available!',
              message: `${gig.title} in ${gig.location} just posted.`,
              timestamp: serverTimestamp(),
              isRead: false,
              relatedId: gigId
            });
          }
        }
      });
    }, (error) => {
      console.error("Gigs Notification Listener Error:", error);
    });

    // Listen for new seekers
    const seekersUnsub = onSnapshot(
      query(collection(db, 'profiles'), where('isOnline', '==', true), where('status', '==', 'reviewed')),
      async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const seeker = change.doc.data();
            const seekerId = change.doc.id;

            if (seekerId === userId) return;

            const q = query(
              collection(db, 'notifications'),
              where('userId', '==', userId),
              where('relatedId', '==', seekerId),
              limit(1)
            );
            const existing = await getDocs(q);

            if (existing.empty) {
              await addDoc(collection(db, 'notifications'), {
                userId,
                type: 'seeker',
                title: 'New Seeker Online',
                message: `${seeker.firstName} ${seeker.surname} is now ready to work in ${seeker.province}.`,
                timestamp: serverTimestamp(),
                isRead: false,
                relatedId: seekerId
              });
            }
          }
        });
      }, (error) => {
        console.error("Seekers Notification Listener Error:", error);
      }
    );

    return () => {
      gigsUnsub();
      seekersUnsub();
    };
  }, [userId]);

  return { notifications, loading, clearNotifications };
}
