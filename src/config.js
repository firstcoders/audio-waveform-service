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
export default {
  // The serverless stage name
  stage: process.env.STAGE,
  // The log level
  logLevel: process.env.LOG_LEVEL,
  // The binary
  audiowaveformBinPath: process.env.AUDIOWAVEFORM_BIN_PAH,
  // The storage bucket
  cacheBucket: process.env.WAVEFORM_BUCKET_NAME,
  // The CORS allowed origins
  CORSAllowedOrigins: process.env.CORS_ALLOWED_ORIGINS,
  // List of origins from which the service can fetch audio
  allowedAudioOrigins: (process.env.ALLOWED_AUDIO_ORIGINS || '*').split(',').map((s) => s.trim()),
  // the folder prefix of the generated waveform json on s3
  s3FolderPrefix: process.env.S3_FOLDER_PREFIX || 'waveform-srv',
};
