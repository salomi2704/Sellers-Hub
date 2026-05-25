export const bulkUploadJob = {
  name: 'bulk-uploads',
  stages: ['validate-csv', 'upsert-catalog-records', 'report-partial-failures'],
  retryLimit: 3,
};
