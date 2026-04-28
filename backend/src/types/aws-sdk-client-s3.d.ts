declare module '@aws-sdk/client-s3' {
  export interface S3ClientConfig {
    region?: string;
    endpoint?: string;
    forcePathStyle?: boolean;
    credentials?: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  }

  export class S3Client {
    constructor(config?: S3ClientConfig);
    send(command: unknown): Promise<unknown>;
  }

  export class PutObjectCommand {
    constructor(input: {
      Bucket: string;
      Key: string;
      Body: Buffer;
      ContentType?: string;
      CacheControl?: string;
    });
  }
}
