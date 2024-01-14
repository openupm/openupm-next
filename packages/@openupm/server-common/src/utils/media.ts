/**
 * Media utils to download, process and upload image to S3 store.
 **/

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import config from 'config';
import sharp from 'sharp';
import { isEmpty } from 'lodash-es';
import { Readable } from 'stream';
import { ReadableStream } from 'stream/web';
import { finished } from 'stream/promises';

import redis from '../redis.js';
import { uploadFile } from './s3.js';
import createLogger from '../log.js';
const logger = createLogger('redis');

// FIXME: use config.dataDir
const dataDir: string = config.dataDir || '';
const mediaDir: string = path.resolve(dataDir, 'media');

// The stored media entry in redis
interface MediaStoreEntry {
  // File name
  filename: string;
  // File size in bytes
  size: number;
  // Expire time in milliseconds (epoch time)
  expire: number;
}

// The media entry returned by getImage()
interface MediaEntry extends MediaStoreEntry {
  // File path
  filePath: string;
  // s3 path
  s3Path: string;
  // Is the image available (not expired)
  available: boolean;
}

/**
 * Get the image entry { available, filename, filePath, s3Path, expire, size }
 * @param {string} imageUrl
 * @param {number} width
 * @param {number} height
 * @param {keyof sharp.FitEnum} fit
 */
export const getImage = async function (
  imageUrl: string,
  width: number,
  height: number,
  fit: keyof sharp.FitEnum,
): Promise<MediaEntry | null> {
  const key = getMediaRedisKey(imageUrl, width, height, fit);
  const obj = await redis.client!.hgetall(key);
  if (isEmpty(obj)) return null;
  const size = parseInt(obj.size) || 0;
  const filename =
    obj.filename || getMediaFilename(imageUrl, width, height, fit, size);
  const filePath = path.join(mediaDir, filename);
  const s3Path = getMediaS3Path(filename);
  const expire = parseInt(obj.expire) || 0;
  const available = new Date().getTime() <= expire;
  return {
    filename,
    size,
    expire,
    filePath,
    s3Path,
    available,
  };
};

/**
 * Download, process an image and upload to S3.
 * @param {string} imageUrl
 * @param {number} width
 * @param {number} height
 * @param {keyof sharp.FitEnum} fit
 * @param {number} duration
 * @param {string} filename
 * @param {boolean} force
 */
export const addImage = async function (
  imageUrl: string,
  width: number,
  height: number,
  fit: keyof sharp.FitEnum,
  duration: number,
  force: boolean = false,
  filename?: string,
): Promise<void> {
  const key: string = getMediaRedisKey(imageUrl, width, height, fit);
  const expire: number = new Date().getTime() + duration;
  const oldImageEntry = await getImage(imageUrl, width, height, fit);

  // download image to a tmp file
  const tmpFilename: string = getMediaTempFilename(
    imageUrl,
    width,
    height,
    fit,
  );
  const tmpFilePath: string = path.join(mediaDir, tmpFilename);
  await _downloadImageUrl(imageUrl, tmpFilePath);

  try {
    // check the image size
    const newSize: number = fs.statSync(tmpFilePath).size;
    if (oldImageEntry && !force) {
      const oldSize: number = oldImageEntry.size;
      if (oldSize === newSize) {
        // update the expire time
        await redis.client!.hset(key, 'expire', expire);
        logger.info(
          { imageUrl, width, height, fit },
          '_cacheImage size remains the same, only update the expire time',
        );
        return;
      }
    }

    // process the image
    if (!filename)
      filename = getMediaFilename(imageUrl, width, height, fit, newSize);
    const filePath: string = path.join(mediaDir, filename);
    await _processImage(
      tmpFilePath,
      filePath,
      getMediaS3Path(filename),
      width,
      height,
      fit,
    );

    // update redis
    await redis.client!.hmset(key, {
      size: newSize,
      expire,
      filename,
    } as MediaStoreEntry);
  } finally {
    // remove the tmp file
    fs.unlinkSync(tmpFilePath);
  }
};

/**
 * Download the image url to the dest path
 * @param {string} imageUrl
 * @param {string} destPath
 */
const _downloadImageUrl = async function (
  imageUrl: string,
  destPath: string,
): Promise<void> {
  try {
    const res = await fetch(imageUrl, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      logger.warn(
        { imageUrl, destPath, status: res.status },
        'image download failed with status {status}',
      );
    } else if (!res.body) {
      logger.warn(
        { imageUrl, destPath },
        'image download failed without response body',
      );
    } else {
      const fileStream = fs.createWriteStream(destPath, { flags: 'wx' });
      await finished(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Readable.fromWeb(res.body as ReadableStream<any>).pipe(fileStream),
      );
      console.log(`Image downloaded from ${imageUrl} to ${destPath}`);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      logger.warn({ imageUrl, destPath }, 'image download failed with timeout');
    } else {
      logger.warn({ imageUrl, destPath, error }, 'image download failed');
    }
  }
};

/**
 * Process the image and upload to s3
 * @param {string} sourcePath
 * @param {string} destLocalPath
 * @param {string} destS3Path
 * @param {number} width
 * @param {number} height
 * @param {keyof sharp.FitEnum} fit
 */
const _processImage = async function (
  sourcePath: string,
  destLocalPath: string,
  destS3Path: string,
  width: number,
  height: number,
  fit: keyof sharp.FitEnum,
): Promise<void> {
  const image = sharp(sourcePath);
  await image
    .resize(width, height, {
      fit,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toFile(destLocalPath);
  // copy to s3
  await uploadFile(
    config.s3.mediaBucket,
    destLocalPath,
    destS3Path,
    'public-read',
    'image/png',
  );
  logger.info({ sourcePath, destLocalPath, destS3Path }, 'image processed');
};

/**
 * Get normalized media filename
 * @param {string} imageUrl
 * @param {number} width
 * @param {number} height
 * @param {keyof sharp.FitEnum} fit
 * @param {number} size
 * @param {string} extname
 */
const getMediaFilename = function (
  imageUrl: string,
  width: number,
  height: number,
  fit: keyof sharp.FitEnum,
  size: number,
  extname?: string | undefined,
): string {
  const md5 = crypto.createHash('md5').update(imageUrl).digest('hex');
  if (!extname) extname = 'png';
  return `${md5}-${width}x${height}-${fit}-${size}.${extname}`;
};

/**
 * Get media redis key
 * @param {string} imageUrl
 * @param {number} width
 * @param {number} height
 * @param {keyof sharp.FitEnum} fit
 */
const getMediaRedisKey = function (
  imageUrl: string,
  width: number,
  height: number,
  fit: keyof sharp.FitEnum,
): string {
  const md5 = crypto.createHash('md5').update(imageUrl).digest('hex');
  return `media:${md5}-${width}x${height}-${fit}`;
};

/**
 * Get media S3 path
 * @param {string} filename
 */
const getMediaS3Path = function (filename: string): string {
  return `media/${filename}`;
};

/**
 * Get an unique temp filename for the image
 * @param {string} imageUrl
 * @param {number} width
 * @param {number} height
 * @param {keyof sharp.FitEnum} fit
 */
const getMediaTempFilename = function (
  imageUrl: string,
  width: number,
  height: number,
  fit: keyof sharp.FitEnum,
): string {
  const md5 = crypto.createHash('md5').update(imageUrl).digest('hex');
  const now = new Date().getTime();
  return `${md5}-${width}x${height}-${fit}-${now}.tmp`;
};
