export interface DashboardStats {
  totalTransactions: number;
  lastLogin: string;
  newAlerts: number;
  pendingTransactions: number;
}

export interface Transaction {
  id: number;
  description: string;
  type: string;
  date: string;
  amount: number;
  status: 'COMPLETED' | 'BLOCKED' | 'PENDING';
  fromAccount?: string;
  toAccount?: string;
}

export interface Alert {
  id: number;
  description: string;
  date: string;
  riskScore: number;
  status: 'OPEN' | 'TRUE POSITIVE' | 'FALSE POSITIVE' | 'RESOLVED';
  transactionId?: number;
}

export interface CustomerProfile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  lastLogin: string;
}

export interface Account {
  id: number;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  openDate: string;
}
