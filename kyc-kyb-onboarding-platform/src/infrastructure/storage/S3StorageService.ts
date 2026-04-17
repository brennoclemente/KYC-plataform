import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageService } from '@/domain/services/IStorageService';

const MAX_PRESIGNED_URL_EXPIRY = 3600;

export class S3StorageService implements IStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    // Only pass explicit credentials if both are set.
    // When running on EC2 with IAM Role, leave credentials undefined
    // so the SDK picks them up automatically from the instance metadata.
    this.client = new S3Client({
      region: process.env.AWS_REGION ?? 'us-east-1',
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });

    this.bucket = process.env.S3_BUCKET_NAME!;
  }

  async upload(file: Buffer, key: string, mimeType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: mimeType,
    });
    await this.client.send(command);
    return key;
  }

  async generatePresignedUrl(s3Key: string, expiresInSeconds?: number): Promise<string> {
    const expiry = Math.min(expiresInSeconds ?? MAX_PRESIGNED_URL_EXPIRY, MAX_PRESIGNED_URL_EXPIRY);
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: s3Key });
    return getSignedUrl(this.client, command, { expiresIn: expiry });
  }
}
