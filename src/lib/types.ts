export interface Participant {
  id: string;
  name: string;
  email: string;
  exclusions?: string[]; // IDs of participants this person cannot draw
}

export interface DrawPair {
  giverId: string;
  giverName: string;
  giverEmail: string;
  receiverId: string;
  receiverName: string;
  receiverEmail: string;
  token: string;
  revealed: boolean;
  revealedAt?: string;
  emailSent?: boolean;
  emailError?: string;
}

export interface DrawSession {
  id: string;
  title: string;
  budget?: string;
  message?: string;
  createdAt: string;
  participants: Participant[];
  pairs: DrawPair[];
}

export interface RevealData {
  sessionTitle: string;
  budget?: string;
  message?: string;
  giverName: string;
  receiverName: string;
  revealed: boolean;
  revealedAt?: string;
}

export interface EmailJSConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export interface EmailProgress {
  participantId: string;
  name: string;
  email: string;
  status: 'pending' | 'sending' | 'success' | 'error';
  error?: string;
  token: string;
  revealUrl: string;
}
