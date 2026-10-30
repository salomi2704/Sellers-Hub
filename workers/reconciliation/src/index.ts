import { LedgerEntry } from '../api/src/finance/dto/ledger-entry.dto';

export const reconciliationJob = {
  name: 'reconciliation',
  stages: ['load-settlements', 'detect-mismatches', 'emit-audit-log'],
  retryLimit: 2,
};

interface SettlementBatch {
  sellerId: string;
  storeId: string;
  expectedPayout: number;
  actualPayout: number;
  discrepancy: number;
  status: 'pending' | 'resolved' | 'failed';
}

export const detectSettlementMismatches = (): SettlementBatch[] => {
  const mismatches: SettlementBatch[] = [];

  // Get all tenant ledger entries
  // In a real system, we'd query the database for all sellers/stores
  // For this demo, we'll check the demo tenant

  const demoKey = 'seller_demo:store_wysh';
  const ledgerEntries = [
    // Simulated ledger entries for the demo tenant
    { id: 'led-1', sellerId: 'seller_demo', storeId: 'store_wysh', type: 'sale', amount: 50000, referenceId: 'ord-1', description: 'Order 1', createdAt: Date.now() - 86400000, status: 'completed' },
    { id: 'led-2', sellerId: 'seller_demo', storeId: 'store_wysh', type: 'sale', amount: 35000, referenceId: 'ord-2', description: 'Order 2', createdAt: Date.now() - 43200000, status: 'completed' },
    { id: 'led-3', sellerId: 'seller_demo', storeId: 'store_wysh', type: 'payout', amount: 40000, referenceId: '', description: 'Settlement Batch 1', createdAt: Date.now() - 86400000, status: 'completed' },
    { id: 'led-4', sellerId: 'seller_demo', storeId: 'store_wysh', type: 'payout', amount: 25000, referenceId: '', description: 'Settlement Batch 2', createdAt: Date.now() - 43200000, status: 'completed' },
  ];

  // Calculate expected payout (total sales) and actual payout (total payouts)
  const sales = ledgerEntries
    .filter((e) => e.type === 'sale' && e.status === 'completed')
    .reduce((sum, e) => sum + e.amount, 0);

  const payouts = ledgerEntries
    .filter((e) => e.type === 'payout' && e.status === 'completed')
    .reduce((sum, e) => sum + e.amount, 0);

  const discrepancy = sales - payouts;

  // If there's a discrepancy, create a mismatch record
  if (Math.abs(discrepancy) > 1) {
    mismatches.push({
      sellerId: 'seller_demo',
      storeId: 'store_wysh',
      expectedPayout: sales,
      actualPayout: payouts,
      discrepancy,
      status: 'pending',
    });
  }

  return mismatches;
};