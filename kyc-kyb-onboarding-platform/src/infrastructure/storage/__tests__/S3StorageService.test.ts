import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AWS SDK modules before importing the service
const mockSend = vi.fn().mockResolvedValue({});

vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: vi.fn().mockImplementation(function () {
      return { send: mockSend };
    }),
    PutObjectCommand: vi.fn().mockImplementation(function (input: unknown) {
      return { input };
    }),
    GetObjectCommand: vi.fn().mockImplementation(function (input: unknown) {
      return { input };
    }),
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://s3.example.com/presigned-url'),
}));

import { S3StorageService } from '../S3StorageService';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

describe('S3StorageService', () => {
  beforeEach(() => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
    process.env.S3_BUCKET_NAME = 'test-bucket';
    vi.clearAllMocks();
  });

  describe('upload', () => {
    it('returns the s3Key after uploading', async () => {
      const service = new S3StorageService();
      const buffer = Buffer.from('file content');
      const key = 'documents/user-123/id.pdf';

      const result = await service.upload(buffer, key, 'application/pdf');

      expect(result).toBe(key);
    });

    it('does not return a URL — only the s3Key', async () => {
      const service = new S3StorageService();
      const result = await service.upload(Buffer.from('data'), 'some/key.jpg', 'image/jpeg');

      expect(result).not.toMatch(/^https?:\/\//);
    });
  });

  describe('generatePresignedUrl', () => {
    it('returns a presigned URL for a given s3Key', async () => {
      const service = new S3StorageService();
      const url = await service.generatePresignedUrl('documents/user-123/id.pdf', 300);

      expect(url).toBe('https://s3.example.com/presigned-url');
    });

    it('caps expiry at 3600 seconds', async () => {
      const service = new S3StorageService();
      await service.generatePresignedUrl('some/key.pdf', 9999);

      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 3600 },
      );
    });

    it('defaults to 3600 seconds when no expiry is provided', async () => {
      const service = new S3StorageService();
      await service.generatePresignedUrl('some/key.pdf');

      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 3600 },
      );
    });

    it('uses the provided expiry when within the 3600s limit', async () => {
      const service = new S3StorageService();
      await service.generatePresignedUrl('some/key.pdf', 600);

      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 600 },
      );
    });
  });
});
