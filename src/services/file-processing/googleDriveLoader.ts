let googleDriveServicePromise: Promise<typeof import('@/services/file-processing/googleDriveService').googleDriveService> | null = null;

export async function getGoogleDriveService() {
  if (!googleDriveServicePromise) {
    googleDriveServicePromise = import('@/services/file-processing/googleDriveService')
      .then((module) => module.googleDriveService);
  }

  return googleDriveServicePromise;
}
