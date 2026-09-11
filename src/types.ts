export interface Gig {
  id: string;
  title: string;
  province: string;
  location: string;
  price: string;
  tags: string[];
  lat: number;
  lng: number;
  ownerId: string;
}

export interface UserProfile {
  id?: string;
  firstName: string;
  middleName?: string;
  surname: string;
  dob: string;
  phone?: string;
  idNumber?: string;
  gender?: string;
  city?: string;
  bio?: string;
  skills?: string;
  profilePictureName?: string;
  profilePictureUrl?: string;
  idDocumentName?: string;
  idDocumentUrl?: string;
  cvName?: string;
  cvUrl?: string;
  certificates: string[];
  province: string;
  isOnline: boolean;
  isAdmin?: boolean;
  status: 'pending' | 'reviewed' | 'incomplete';
  updatedAt: any;
  subscription?: {
    status: 'trial' | 'active' | 'pending_verification' | 'expired';
    trialStartDate: any;
    expiresAt: any;
    proofOfPaymentName?: string;
    proofOfPaymentUrl?: string;
  };
}

export interface SubscriptionPayment {
  id?: string;
  userId: string;
  amount: number;
  reference: string;
  timestamp: any;
  status: 'pending' | 'verified' | 'rejected';
  proofOfPaymentName: string;
  receiptUrl?: string;
}

export interface HireRequest {
  id: string;
  seekerId: string;
  hirerId: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: any;
  expiresAt: any;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'gig' | 'seeker' | 'system';
  title: string;
  message: string;
  timestamp: any;
  isRead: boolean;
  relatedId?: string;
}
