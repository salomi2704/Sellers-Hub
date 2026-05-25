export const mediaProcessorJob = {
  name: 'media-processor',
  stages: ['download-private-object', 'transform-with-sharp', 'upload-variants'],
  retryLimit: 5,
};
