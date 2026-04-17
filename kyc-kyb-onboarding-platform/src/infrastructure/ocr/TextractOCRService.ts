import {
  TextractClient,
  StartDocumentAnalysisCommand,
  GetDocumentAnalysisCommand,
  Block,
} from '@aws-sdk/client-textract';

export interface TextractJobResult {
  status: 'SUCCEEDED' | 'FAILED' | 'IN_PROGRESS';
  blocks?: Block[];
  statusMessage?: string;
}

export class TextractOCRService {
  private readonly client: TextractClient;
  private readonly bucket: string;

  constructor() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    this.client = new TextractClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });
    this.bucket = process.env.S3_BUCKET_NAME!;
  }

  async startDocumentAnalysis(s3Key: string): Promise<string> {
    const command = new StartDocumentAnalysisCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: this.bucket,
          Name: s3Key,
        },
      },
      FeatureTypes: ['FORMS', 'TABLES'],
    });

    const response = await this.client.send(command);

    if (!response.JobId) {
      throw new Error('Textract did not return a JobId');
    }

    return response.JobId;
  }

  async getJobResult(jobId: string): Promise<TextractJobResult> {
    const command = new GetDocumentAnalysisCommand({ JobId: jobId });
    const response = await this.client.send(command);

    const jobStatus = response.JobStatus;

    if (jobStatus === 'SUCCEEDED') {
      return {
        status: 'SUCCEEDED',
        blocks: response.Blocks ?? [],
        statusMessage: response.StatusMessage,
      };
    }

    if (jobStatus === 'FAILED') {
      return {
        status: 'FAILED',
        statusMessage: response.StatusMessage,
      };
    }

    return {
      status: 'IN_PROGRESS',
      statusMessage: response.StatusMessage,
    };
  }
}
