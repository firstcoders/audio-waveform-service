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
import { spawnSync } from 'child_process';
import { logger } from '@soundws/service-libs';
import { readFileSync } from 'fs';
import normalize from 'array-normalize';
import config from '../config';

export default (inputpath, outputpath, options = {}) => {
  logger.debug('Start generating waveform file', { inputpath, outputpath, options });

  try {
    const result = spawnSync(
      config.audiowaveformBinPath,
      [
        '-i',
        inputpath,
        '--input-format',
        options.inputFormat || 'wav',
        '-o',
        outputpath,
        '--pixels-per-second',
        options.pixelsPerSecond || 20,
        '--bits',
        options.bits || 16,
      ],
      {
        stdio: 'pipe',
        encoding: 'utf-8',
      }
    );

    if (result.error || result.status > 0) {
      throw new Error('Generate waveform command failed with status', { status: result.status });
    }

    const contents = readFileSync(outputpath, 'utf-8');

    logger.debug('Succeeded generating waveform file', { inputpath, outputpath, options });

    const parsed = JSON.parse(contents);

    return {
      ...parsed,
      data: normalize(parsed.data)
        .map((x) => x * 2 - 1) // we need values between -1 and 1
        .map((e) => Math.round(e * 100, 2) / 100), // we return a normalized representation, rounded to 2 decimals
    };
  } catch (error) {
    logger.error('Failed generating waveform file', { inputpath, outputpath, options });
    throw error;
  }
};
