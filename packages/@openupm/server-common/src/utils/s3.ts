// S3 util.

import fs from 'fs';
import configRaw from 'config';
import {
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  PutObjectCommandInput,
  PutObjectCommandOutput,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;

type OpenUPMS3ClientConfig = S3ClientConfig & {
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  s3ForcePathStyle?: boolean;
  sslEnabled?: boolean;
};

/**
 * Convert node-config and legacy AWS SDK v2 style options to a mutable AWS SDK
 * v3 S3ClientConfig.
 */
export const normalizeS3ClientConfig = (
  rawConfig: OpenUPMS3ClientConfig,
): S3ClientConfig => {
  const {
    accessKeyId,
    secretAccessKey,
    sessionToken,
    credentials,
    ...restConfig
  } = rawConfig;
  const s3ForcePathStyle = restConfig.s3ForcePathStyle;
  const sslEnabled = restConfig.sslEnabled;
  delete restConfig.s3ForcePathStyle;
  delete restConfig.sslEnabled;
  const clientConfig: S3ClientConfig = { ...restConfig };

  if (credentials) {
    clientConfig.credentials =
      typeof credentials === 'function' ? credentials : { ...credentials };
  } else if (accessKeyId && secretAccessKey) {
    clientConfig.credentials = {
      accessKeyId,
      secretAccessKey,
      ...(sessionToken ? { sessionToken } : {}),
    };
  }

  if (
    clientConfig.forcePathStyle === undefined &&
    s3ForcePathStyle !== undefined
  ) {
    clientConfig.forcePathStyle = s3ForcePathStyle;
  }

  if (clientConfig.tls === undefined && sslEnabled !== undefined) {
    clientConfig.tls = sslEnabled;
  }

  return clientConfig;
};

/**
 * Get S3 client.
 */
export const getS3Client = (): S3Client => {
  return new S3Client(normalizeS3ClientConfig(config.s3.config));
};

/**
 * Uploads a file to S3.
 * @param {string} bucket - The S3 bucket name.
 * @param {string} localPath - The local path of the file to upload.
 * @param {string} remotePath - The remote path to store the file in S3.
 * @param {string} [acl] - The ACL (Access Control List) for the uploaded file.
 * @param {string} [contentType] - The content type of the uploaded file.
 * @returns {Promise<object>} - A promise that resolves to the uploaded file data.
 */
export const uploadFile = function (
  bucket: string,
  localPath: string,
  remotePath: string,
  acl?: PutObjectCommandInput['ACL'],
  contentType?: string,
): Promise<PutObjectCommandOutput> {
  const client = getS3Client();
  const readStream = fs.createReadStream(localPath);
  const params: PutObjectCommandInput = {
    Bucket: bucket,
    Key: remotePath,
    Body: readStream,
  };
  if (acl) params.ACL = acl;
  if (contentType) params.ContentType = contentType;

  const upload = new Upload({
    client,
    params,
  });

  return upload
    .done()
    .finally(() => {
      readStream.destroy();
    });
};

/**
 * Remove file from S3.
 * @param {string} bucket - The S3 bucket name.
 * @param {string} remotePath - The remote path of the file to remove from S3.
 * @returns {Promise<object>} - A promise that resolves to the removed file data.
 */
export const removeFile = function (
  bucket: string,
  remotePath: string,
): Promise<DeleteObjectCommandOutput> {
  const client = getS3Client();
  const params = {
    Bucket: bucket,
    Key: remotePath,
  };
  return client.send(new DeleteObjectCommand(params));
};
