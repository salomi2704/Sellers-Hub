export const analyticsIngestionJob = {
  name: 'analytics-ingestion',
  stages: ['accept-batch', 'aggregate-metrics', 'publish-reporting-view'],
  retryLimit: 10,
};
