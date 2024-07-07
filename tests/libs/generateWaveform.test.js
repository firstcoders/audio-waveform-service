import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import generateWaveform from '../../src/libs/generateWaveform';

jest.mock('@firstcoders/service-libs/src/logger');
jest.mock('child_process', () => ({
  spawnSync: jest.fn(),
}));

describe('generateWaveform', () => {
  describe('failure', () => {
    beforeEach(() => {
      spawnSync.mockReturnValue({ error: 'blah', status: 1 });
    });

    it('throws an error', () => {
      let thrownError;

      try {
        generateWaveform();
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeInstanceOf(Error);
    });
  });

  describe('success', () => {
    beforeEach(() => {
      spawnSync.mockReturnValue({ status: 0 });
      readFileSync.mockReturnValue(JSON.stringify({ data: [1, 2, 3, 4] }));
    });
    it.skip('parses and normalises the output', () => {
      const result = generateWaveform();
      expect(result.data).toStrictEqual([-1, -0.33, 0.33, 1]);
    });
  });
});
