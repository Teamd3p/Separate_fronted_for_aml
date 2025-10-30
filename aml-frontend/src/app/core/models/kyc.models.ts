export interface KycDocument {
  id: number;
  customerId: number;
  customerName: string;
  documentType: DocumentType;
  status: KycStatus;
  fileName: string;
  filePath?: string;
  fileSize: number;
  documentNumber?: string;
  verificationNotes?: string;
  verifiedByName?: string;
  uploadTimestamp: string;
  verificationTimestamp?: string;
  riskScore?: number;
  validated: boolean;
}

export interface KycDocumentSummary {
  id: number;
  documentType: DocumentType;
  status: KycStatus;
  fileName: string;
  filePath?: string;
  uploadTimestamp: string;
  riskScore?: number;
}

export interface KycStatusSummary {
  customerId: number;
  customerName?: string;
  kycComplete: boolean;
  totalDocuments: number;
  verifiedDocuments: number;
  pendingDocuments: number;
  rejectedDocuments: number;
  highRiskDocuments: number;
  overallKycStatus: string;
}

export interface KycDocumentUploadRequest {
  customerId: number;
  documentType: DocumentType;
  file: File;
}

export interface KycDocumentVerificationRequest {
  documentId: number;
  officerId: number;
  status: KycStatus;
  verificationNotes?: string;
}

export enum DocumentType {
  PASSPORT = 'PASSPORT',
  PAN = 'PAN',
  AADHAAR = 'AADHAAR',
  DRIVING_LICENSE = 'DRIVING_LICENSE',
  VOTER_ID = 'VOTER_ID'
}

export enum KycStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  UNDER_REVIEW = 'UNDER_REVIEW'
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
