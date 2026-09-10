import { useState, useEffect } from 'react';
import { db, collection, query, onSnapshot, where, updateDoc, doc } from '../lib/firebase';
import { HireRequest } from '../types';

export function useHireRequests(userId: string) {
  const [incomingRequest, setIncomingRequest] = useState<HireRequest | null>(null);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'hire_requests'),
      where('seekerId', '==', userId),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HireRequest[];
      
      // Get the most recent pending request
      if (requests.length > 0) {
        setIncomingRequest(requests[0]);
      } else {
        setIncomingRequest(null);
      }
    }, (error) => {
      console.error("Hire Requests Listener Error:", error);
    });

    return unsubscribe;
  }, [userId]);

  const respondToRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      await updateDoc(doc(db, 'hire_requests', requestId), { status });
      setIncomingRequest(null);
    } catch (error) {
      console.error("Error responding to hire request:", error);
    }
  };

  return { incomingRequest, respondToRequest };
}
