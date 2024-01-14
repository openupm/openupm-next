// S3 util.

import fs from 'fs';
import config from 'config';
import AWS from 'aws-sdk';

/**
 * Get S3 client.
 */
export const getS3Client = (): AWS.S3 => {
  AWS.config.update(config.s3.config);
  const s3Client = new AWS.S3();
  return s3Client;
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
  acl?: string,
  contentType?: string,
): Promise<object> {
  const s3 = getS3Client();
  const readStream = fs.createReadStream(localPath);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any = {
    Bucket: bucket,
    Delimiter: '/',
    Key: remotePath,
    Body: readStream,
  };
  if (acl) params.ACL = acl;
  if (contentType) params.ContentType = contentType;

  return new Promise((resolve, reject) => {
    s3.upload(params, function (err, data) {
      readStream.destroy();
      if (err) return reject(err);
      return resolve(data);
    });
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
): Promise<object> {
  const s3 = getS3Client();
  const params = {
    Bucket: bucket,
    Key: remotePath,
  };

  return new Promise((resolve, reject) => {
    s3.deleteObject(params, function (err, data) {
      if (err) return reject(err);
      return resolve(data);
    });
  });
};
