export interface IStorageService {
  upload(file: Buffer, key: string, mimeType: string): Promise<string>; // returns s3Key
  generatePresignedUrl(s3Key: string, expiresInSeconds?: number): Promise<string>;
}
