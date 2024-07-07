/**
 * Copyright (C) 2019-2023 First Coders LTD
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
import { unlinkSync } from 'fs';
import createHandler from '@firstcoders/service-libs/src/createHandler';
import downloadFile from '@firstcoders/service-libs/src/downloadFile';
import s3WriteFile from '@firstcoders/service-libs/src/s3WriteFile';
import s3ReadFile from '@firstcoders/service-libs/src/s3ReadFile';
import logger from '@firstcoders/service-libs/src/logger';
import getCorsHeaders from '@firstcoders/service-libs/src/getCorsHeaders';
import generateWaveform from '../libs/generateWaveform';
import getCacheKey from '../services/getCacheKey';
import config from '../config';

const createBadRequestResponse = (errors) => ({
  statusCode: 400,
  body: JSON.stringify({
    errors,
  }),
});

const handleRequest = async (event) => {
  const queryParams = event.queryStringParameters || {};
  const { authorizer } = event?.requestContext || {};
  const { sourceUrl } = queryParams;
  let { inputFormat } = queryParams;

  // sourceUrl validation
  if (!sourceUrl || !sourceUrl.match(/https?:\/\/.*/)) {
    return createBadRequestResponse([
      {
        property: 'sourceUrl',
        message: 'the property sourceUrl must be a url',
      },
    ]);
  }

  // Inputformat not provided. Infer from sourceUrl
  // @see https://github.com/bbc/audiowaveform#usage for supported input formats
  if (!inputFormat) {
    const result = sourceUrl.match(/\.(?<inputFormat>wav|mp3|flac|ogg|opus|dat)/);
    inputFormat = result?.groups?.inputFormat;
  }

  // validate input format
  if (['wav', 'mp3', 'flac', 'ogg', 'opus', 'dat'].indexOf(inputFormat) === -1) {
    return createBadRequestResponse([
      {
        property: 'inputFormat',
        message: 'the inputFormat must be one of wav|mp3|flac|ogg|opus|dat',
      },
    ]);
  }

  // validate that the audio origin is allowed
  // If the allowedAudioOrigins claim exists in the Bearer token, then this overrides any global/config value for allowedAudioOrigins
  try {
    const allowedOrigins =
      authorizer?.allowedAudioOrigins?.split(',').map((v) => v.trim()) ||
      config.allowedAudioOrigins;

    if (
      allowedOrigins.indexOf('*') === -1 &&
      allowedOrigins.find((v) => sourceUrl.indexOf(v) === 0) === undefined
    ) {
      throw new Error('the origin is not permitted');
    }
  } catch (error) {
    return createBadRequestResponse([
      {
        property: 'sourceUrl',
        message: 'the origin is not permitted',
      },
    ]);
  }

  const cacheKey = getCacheKey(sourceUrl);
  const s3Key = `${config.s3FolderPrefix}/${cacheKey}.json`;
  const tmpfilepath = `/tmp/${cacheKey}`;
  const waveformfilepath = `${tmpfilepath}.json`;
  let waveformJson;

  try {
    logger.debug('Attempt to waveform from s3', { s3Key });
    waveformJson = await s3ReadFile(config.cacheBucket, s3Key);
  } catch (error) {
    logger.debug('Waveform does not exist. Commence generating', { s3Key });

    // @TODO store lock in s3 to prevent concurrent generation of waveform multiple times

    try {
      // first download the audio file
      await downloadFile(sourceUrl, tmpfilepath);
    } catch (error2) {
      return createBadRequestResponse([
        {
          property: 'sourceUrl',
          message: 'Failed to download audio file',
        },
      ]);
    }

    try {
      // generate the waveform
      const waveformData = generateWaveform(tmpfilepath, waveformfilepath, { inputFormat });
      waveformJson = JSON.stringify(waveformData);
    } catch (error2) {
      logger.error('Failed to generate the waveform', { error: error.message });

      return createBadRequestResponse([
        {
          property: 'sourceUrl',
          message: 'Failed to generate waveform from audio file',
        },
      ]);
    }

    // upload the waveform to the s3 cache
    await s3WriteFile(config.cacheBucket, s3Key, waveformJson);

    // cleanup
    try {
      unlinkSync(waveformfilepath);
    } catch (error2) {
      logger.error('Could not delete file', { waveformfilepath });
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Cache-Control': `public, max-age=2592000`,
    },
    body: waveformJson,
  };
};

const handler = createHandler(async (event) => {
  try {
    const response = await handleRequest(event);

    return {
      ...response,
      headers: {
        // all is json
        'Content-Type': 'application/json',

        // mix in the cors headers
        ...getCorsHeaders({
          requestHeaders: event.headers,
          allowedOrigins: config.CORSAllowedOrigins,
        }),

        ...response.headers,
      },
    };
  } catch (error) {
    logger.error('The request failed', { error: error.message });
    throw error;
  }
});

// eslint-disable-next-line import/prefer-default-export
export { handler };
