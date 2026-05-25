export const affiliateSyncJob = {
  name: 'affiliate-sync',
  stages: ['fetch-approved-feed', 'refresh-offers', 'invalidate-cache'],
  retryLimit: 5,
};
