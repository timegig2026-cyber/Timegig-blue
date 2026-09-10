import { useState, useEffect } from 'react';
import { db, collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, handleFirestoreError, OperationType } from '../lib/firebase';
import { Gig } from '../components/GigsView';

const MOCK_GIGS_DATA = [
  { title: 'Graphic Designer Needed', province: 'Gauteng', location: 'Johannesburg', price: 'R450/hr', tags: ['Design', 'Remote'], lat: -26.2041, lng: 28.0473, ownerId: 'system' },
  { title: 'Local Dog Walker', province: 'Western Cape', location: 'Cape Town', price: 'R150/hr', tags: ['Pet Care', 'In-Person'], lat: -33.9249, lng: 18.4241, ownerId: 'system' },
  { title: 'React Developer for Startup', province: 'Gauteng', location: 'Pretoria', price: 'R600/hr', tags: ['Tech', 'Remote'], lat: -25.7479, lng: 28.2293, ownerId: 'system' },
  { title: 'Event Photographer', province: 'KwaZulu-Natal', location: 'Durban', price: 'R2500/day', tags: ['Photography', 'In-Person'], lat: -29.8587, lng: 31.0218, ownerId: 'system' },
  { title: 'Freelance Copywriter', province: 'Eastern Cape', location: 'Gqeberha', price: 'R350/hr', tags: ['Writing', 'Remote'], lat: -33.9608, lng: 25.6022, ownerId: 'system' },
  { title: 'House Cleaning Service', province: 'Western Cape', location: 'Stellenbosch', price: 'R250/hr', tags: ['Cleaning', 'In-Person'], lat: -33.9321, lng: 18.8602, ownerId: 'system' },
  { title: 'Plumber Needed ASAP', province: 'Limpopo', location: 'Polokwane', price: 'R800/job', tags: ['Maintenance', 'In-Person'], lat: -23.8962, lng: 29.4486, ownerId: 'system' },
  { title: 'Maths Tutor (Grade 12)', province: 'Mpumalanga', location: 'Mbombela', price: 'R200/hr', tags: ['Education', 'Remote'], lat: -25.4753, lng: 30.9694, ownerId: 'system' },
];

export function useGigs() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const gigsRef = collection(db, 'gigs');
    
    // We no longer attempt to seed gigs from the client to avoid permission errors.
    // Gigs should be created by users or via a backend process.

    const q = query(gigsRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let gigsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // If no real gigs exist, we show mock data in the UI
      if (gigsData.length === 0) {
        gigsData = MOCK_GIGS_DATA.map((g, i) => ({
          id: `mock-gig-${i}`,
          ...g
        }));
      }

      setGigs(gigsData);
      setLoading(false);
    }, (error) => {
      // Avoid throwing on background listeners to prevent app crash, but log it
      try {
        handleFirestoreError(error, OperationType.GET, 'gigs');
      } catch (e) {
        console.error("Background Firestore Error:", e);
      }
    });
    return unsubscribe;
  }, []);

  const applyForGig = async (gigId: string, applicantId: string) => {
    const path = 'applications';
    try {
      const applicationsRef = collection(db, path);
      await addDoc(applicationsRef, {
        gigId,
        applicantId,
        status: 'pending',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const completeGig = async (gigId: string) => {
    try {
      const gigRef = doc(db, 'gigs', gigId);
      await updateDoc(gigRef, { status: 'completed' });
    } catch (error) {
      console.error("Failed to complete gig:", error);
    }
  };

  return { gigs, loading, applyForGig, completeGig };
}
