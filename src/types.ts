export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
}

export interface ServicePrice {
  name: string;
  priceXOF: number;
  priceSats: number;
  quantityAvailable?: number; // Quantité disponible ou places restantes
}

export interface Hospital {
  id: string;
  name: string;
  type: 'public' | 'private' | 'clinic' | 'lab';
  image: string;
  rating: number;
  reviewsCount: number;
  distance: string;
  address: string;
  phone: string;
  hours: string;
  isVerified: boolean;
  adminEmail?: string;
  services: string[];
  priceList: ServicePrice[];
  reviews: Review[];
  coords: { x: number; y: number }; // Simulated vector coordinates on our Abomey-Calavi map
  lat?: number;
  lng?: number;
}

export interface MedicalDocument {
  id: string;
  title: string;
  type: 'analyses' | 'prescription' | 'devis';
  items: { name: string; quantity?: number; priceXOF: number }[];
  priceXOF: number;
  priceSats: number;
  notes?: string;
  patientNpi?: string;
  hospitalId?: string;
  hospitalName?: string;
  doctorName?: string;
  doctorEmail?: string;
  date?: string;
  history?: { modifiedAt: string; modifiedBy: string; changes: string }[];
}

export interface Appointment {
  id: string;
  hospitalId: string;
  hospitalName: string;
  date: string;
  timeSlot: string;
  patientName: string;
  patientEmail?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  service?: string;
  reason?: string;
  doctorName?: string;
  isPaid?: boolean;
  paymentMethod?: 'Wallet' | 'Lightning' | 'Credit' | 'Free';
  amountPaidXOF?: number;
  amountPaidSats?: number;
  cancellationReason?: string;
  creditAvailable?: boolean;
  creditUsedBy?: string;
  createdAt?: string;
}

export interface Invoice {
  id: string;
  patientName: string;
  patientPhone?: string;
  hospitalName: string;
  hospitalAddress: string;
  date: string;
  items: { name: string; priceXOF: number }[];
  totalXOF: number;
  totalSats: number;
  paymentMethod: 'Wallet' | 'Lightning' | 'FamilyHelp';
  txHash: string;
  isPaid: boolean;
  doctorName?: string;
  doctorPhone?: string;
}

export interface Patient {
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  satoshiBalance?: number; // Portefeuille Bitcoin Lightning en Satoshis
  npi?: string;
  avatar?: string;
  bloodGroup?: string;
  recurringDiseases?: string;
  antecedents?: string;
  allergies?: string;
}

export interface HospitalUser {
  email: string;
  hospitalId: string;
  role: 'doctor' | 'admin' | 'nurse';
  name?: string;
}

export interface AccessRequest {
  id: string;
  npi: string;
  doctorEmail: string;
  hospitalName: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  confirmedAt?: string;
  blockchainTxHash?: string;
}

export type AppView = 'landing' | 'map' | 'hospital-details' | 'payment-flow' | 'wallet' | 'appointments' | 'auth' | 'hospital-dashboard';

