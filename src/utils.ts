import { CurrencyFormat } from './types';

export const formatCurrency = (amount: number, format: CurrencyFormat = 'compact'): string => {
  if (format === 'scientific') return `$${amount.toExponential(2)}`;
  if (format === 'detailed') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  
  if (amount < 1000) return `$${amount.toFixed(2)}`;
  if (amount < 1000000) return `$${(amount / 1000).toFixed(2)}K`;
  if (amount < 1000000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount < 1000000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount < 1000000000000000) return `$${(amount / 1000000000000).toFixed(2)}T`;
  if (amount < 1000000000000000000) return `$${(amount / 1000000000000000).toFixed(2)}Qa`;
  return `$${(amount / 1000000000000000000).toFixed(2)}Qi`;
};

export const calculateCost = (baseCost: number, level: number): number => {
  return Math.floor(baseCost * Math.pow(1.35, level));
};

export const calculateIncome = (baseIncome: number, level: number, multiplier: number, prestigePoints: number): number => {
  if (level === 0) return 0;
  const prestigeBonus = 1 + (prestigePoints * 0.02); // 2% bonus per prestige point
  const globalDifficultySuppression = 0.4; // 60% reduction in all income sources
  return baseIncome * level * multiplier * prestigeBonus * globalDifficultySuppression;
};

export const formatGameDate = (days: number): string => {
  const startDate = new Date(2000, 0, 1);
  const currentDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
  return currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, auth: any) {
  const errorMsg = error instanceof Error ? error.message : String(error);
  
  // Ignore cancelled popup requests as they are user-initiated and non-fatal
  if (errorMsg.includes('auth/cancelled-popup-request')) {
    console.warn('Auth popup cancelled by user');
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
