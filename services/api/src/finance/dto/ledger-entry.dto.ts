export type LedgerEntryId = string;

export type LedgerEntryType = 'sale' | 'refund' | 'payout' | 'adjustment';

export interface LedgerEntry {
  id: LedgerEntryId;
  sellerId: string;
  storeId: string;
  type: LedgerEntryType;
  amount: number;
  referenceId?: string; // order ID, payment ID, etc.
  description: string;
  createdAt: number;
  status: 'pending' | 'completed' | 'failed';
}