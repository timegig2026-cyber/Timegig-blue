export interface Gig {
  id: string;
  title: string;
  description?: string;
  province: string;
  location: string;
  price: string;
  tags: string[];
  lat: number;
  lng: number;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerAvatar?: string;
  ownerPhone?: string;
  ownerDisabled?: boolean;
  status?: 'active' | 'completed' | 'paused' | 'cancelled';
  cancellationReason?: string;
  cancelledBy?: string;
  imageUrl?: string;
  imageUris?: string[];
  timestamp?: any;
  createdAt?: any;
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
  isDisabled?: boolean;
  disabledAt?: any;
  isAdmin?: boolean;
  status: 'pending' | 'reviewed' | 'incomplete';
  updatedAt: any;
  subscription?: {
    status: 'trial' | 'active' | 'pending_verification' | 'expired';
    trialStartDate: any;
    expiresAt: any;
    proofOfPaymentName?: string;
    proofOfPaymentUrl?: string;
    amount?: number;
    reference?: string;
    updatedAt?: any;
    submittedAt?: any;
  };
}

export interface SubscriptionPayment {
  id?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  reference: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
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
  gigId?: string;
  gigTitle?: string;
  destination?: {
    lat: number;
    lng: number;
    title?: string;
    location?: string;
  };
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
