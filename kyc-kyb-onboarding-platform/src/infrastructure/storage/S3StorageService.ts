import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageService } from '@/domain/services/IStorageService';

const MAX_PRESIGNED_URL_EXPIRY = 3600; // 60 minutes

export class S3StorageService implements IStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.bucket = process.env.S3_BUCKET_NAME!;
  }

  /**
   * Uploads a file to S3 with private access and returns the s3Key.
   * The bucket must be configured with public access disabled.
   */
  async upload(file: Buffer, key: string, mimeType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: mimeType,
      // No ACL set — relies on bucket default (private)
    });

    await this.client.send(command);

    return key;
  }

  /**
   * Generates a pre-signed URL for temporary access to a private S3 object.
   * Expiry is capped at MAX_PRESIGNED_URL_EXPIRY (3600 seconds).
   */
  async generatePresignedUrl(s3Key: string, expiresInSeconds?: number): Promise<string> {
    const expiry = Math.min(expiresInSeconds ?? MAX_PRESIGNED_URL_EXPIRY, MAX_PRESIGNED_URL_EXPIRY);

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
    });

    return getSignedUrl(this.client, command, { expiresIn: expiry });
  }
}
