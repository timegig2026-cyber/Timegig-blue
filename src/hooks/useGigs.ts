import { useState, useEffect } from 'react';
import { db, collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, handleFirestoreError, OperationType } from '../lib/firebase';
import { Gig } from '../types';

// Community fallbacks for legacy records without stored owner name
const REAL_COMMUNITY_CREATORS = [
  { name: 'Kagiso Molefe', desc: 'Looking for a skilled, reliable individual for this task. Good communication and punctuality required.' },
  { name: 'Nomsa Buthelezi', desc: 'Need quality work done promptly. All materials and requirements provided on site.' },
  { name: 'Bongani Dlamini', desc: 'Urgent requirement for an experienced person. Great rates with prompt payment.' },
  { name: 'Lethabo M.', desc: 'Short-term assignment with possibility of repeat ongoing gigs for great performers.' },
  { name: 'Sarah Jenkins', desc: 'Seeking verified service provider. Flexible scheduling available.' },
  { name: 'Sipho Ndlovu', desc: 'Hands-on task in local area. Please review details and apply with your availability.' },
  { name: 'Zanele Khumalo', desc: 'Friendly client looking for dedicated assistance. References appreciated.' }
];

export function useGigs(currentUserId?: string) {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const gigsRef = collection(db, 'gigs');
    const q = query(gigsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let gigsData = snapshot.docs.map((docSnap, index) => {
        const data = docSnap.data();
        const fallback = REAL_COMMUNITY_CREATORS[index % REAL_COMMUNITY_CREATORS.length];

        return {
          id: docSnap.id,
          title: data.title || 'General GiG',
          description: data.description || fallback.desc,
          province: data.province || 'Gauteng',
          location: data.location || 'Johannesburg',
          price: data.price || 'R350/hr',
          tags: Array.isArray(data.tags) ? data.tags : ['General', 'In-Person'],
          lat: typeof data.lat === 'number' ? data.lat : -26.2041,
          lng: typeof data.lng === 'number' ? data.lng : 28.0473,
          ownerId: data.ownerId || 'community-user',
          ownerName: data.ownerName || (data.ownerId === currentUserId ? 'You (Account)' : fallback.name),
          ownerEmail: data.ownerEmail || '',
          ownerAvatar: data.ownerAvatar || '',
          ownerPhone: data.ownerPhone || '',
          ownerDisabled: !!data.ownerDisabled,
          status: data.status || 'active',
          imageUrl: data.imageUrl || '',
          createdAt: data.createdAt || data.timestamp || null,
          timestamp: data.timestamp || data.createdAt || null
        } as Gig;
      });

      // Filter out gigs whose owners have disabled their account,
      // but keep them visible if the current logged-in user is the owner
      gigsData = gigsData.filter(g => {
        if (g.ownerDisabled) {
          return currentUserId && g.ownerId === currentUserId;
        }
        return true;
      });

      // Sort newest first
      gigsData.sort((a, b) => {
        const getMs = (item: Gig) => {
          const t = item.createdAt || item.timestamp;
          if (t?.toDate) return t.toDate().getTime();
          if (t?.seconds) return t.seconds * 1000;
          if (typeof t === 'string' || typeof t === 'number') return new Date(t).getTime();
          return 0;
        };
        return getMs(b) - getMs(a);
      });

      setGigs(gigsData);
      setLoading(false);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'gigs');
      } catch (e) {
        console.error("Background Firestore Error in gigs hook:", e);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUserId]);

  const applyForGig = async (gigId: string, applicantId: string, gigOwnerId?: string, gigTitle?: string) => {
    const path = 'applications';
    try {
      const applicationsRef = collection(db, path);
      const docRef = await addDoc(applicationsRef, {
        gigId,
        applicantId,
        status: 'pending',
        timestamp: serverTimestamp()
      });

      if (gigOwnerId && gigOwnerId !== 'system' && gigOwnerId !== applicantId) {
        await addDoc(collection(db, 'notifications'), {
          userId: gigOwnerId,
          type: 'gig',
          title: 'New Applicant!',
          message: `Someone just applied for your gig: ${gigTitle || 'Gig'}`,
          timestamp: serverTimestamp(),
          isRead: false,
          relatedId: gigId
        });
      }

      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  };

  const completeGig = async (gigId: string) => {
    try {
      const gigRef = doc(db, 'gigs', gigId);
      await updateDoc(gigRef, { status: 'completed' });
    } catch (error) {
      console.error("Failed to complete gig:", error);
      throw error;
    }
  };

  const cancelGig = async (gigId: string, reason?: string, cancelledBy?: string, gigTitle?: string, gigOwnerId?: string) => {
    try {
      const gigRef = doc(db, 'gigs', gigId);
      const updateData: any = { status: 'cancelled' };
      if (reason) updateData.cancellationReason = reason;
      if (cancelledBy) updateData.cancelledBy = cancelledBy;
      await updateDoc(gigRef, updateData);

      if (gigOwnerId && cancelledBy && gigOwnerId !== cancelledBy) {
        await addDoc(collection(db, 'notifications'), {
          userId: gigOwnerId,
          type: 'gig',
          title: 'Gig Cancelled',
          message: `Your gig ${gigTitle || ''} was cancelled. Reason: ${reason || 'No reason provided'}`,
          timestamp: serverTimestamp(),
          isRead: false,
          relatedId: gigId
        });
      }
    } catch (error) {
      console.error("Failed to cancel gig:", error);
      throw error;
    }
  };

  const updateGig = async (gigId: string, updates: Partial<Omit<Gig, 'id'>>) => {
    try {
      const gigRef = doc(db, 'gigs', gigId);
      await updateDoc(gigRef, updates);
    } catch (error) {
      console.error("Failed to update gig:", error);
      throw error;
    }
  };

  const deleteGig = async (gigId: string) => {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      const gigRef = doc(db, 'gigs', gigId);
      await deleteDoc(gigRef);
    } catch (error) {
      console.error("Failed to delete gig:", error);
      throw error;
    }
  };

  const createGig = async (gigData: Omit<Gig, 'id'>) => {
    const path = 'gigs';
    try {
      const gigsRef = collection(db, path);
      const docRef = await addDoc(gigsRef, {
        ...gigData,
        status: 'active',
        ownerDisabled: false,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  };

  return { gigs, loading, applyForGig, completeGig, cancelGig, createGig, updateGig, deleteGig };
}

