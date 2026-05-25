export const reconciliationJob = {
  name: 'reconciliation',
  stages: ['load-settlements', 'detect-mismatches', 'emit-audit-log'],
  retryLimit: 2,
};
