import { getEtag, s3ReadFile, downloadFile } from '@soundws/service-libs';
import { handler } from '../../src/handlers/getWaveform';
import generateWaveform from '../../src/libs/generateWaveform';
import config from '../../src/config';

jest.mock('@soundws/service-libs/src/getEtag');
jest.mock('@soundws/service-libs/src/s3ReadFile');
jest.mock('@soundws/service-libs/src/s3WriteFile');
jest.mock('@soundws/service-libs/src/downloadFile');
jest.mock('../../src/libs/generateWaveform');
jest.mock('@soundws/service-libs/src/logger');

describe('getWaveform', () => {
  describe('when no valid sourceUrl is provided', () => {
    it('returns a 400 with error message', async () => {
      const response = await handler({});
      expect(response.statusCode).toBe(400);
      expect(response.body).toMatch(/sourceUrl/);
    });
  });

  describe('when the upstream etag cannot be fetched', () => {
    it('returns a 400 with error message', async () => {
      getEtag.mockRejectedValue(new Error());

      const response = await handler({
        queryStringParameters: {
          sourceUrl: 'https://get-it-here.com/my-audio-file.mp3',
        },
      });
      expect(response.statusCode).toBe(400);
      expect(response.body).toMatch(/etag/);
    });
  });

  describe('when the waveform is already cached on s3', () => {
    it('reads the data from s3 and returns it in the response', async () => {
      getEtag.mockResolvedValue('thisisanetag');

      const waveformdata = JSON.stringify({ thisisawaveform: [1, 2, 3] });

      s3ReadFile.mockResolvedValue(waveformdata);

      const response = await handler({
        queryStringParameters: {
          sourceUrl: 'https://get-it-here.com/my-audio-file.mp3',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toMatch(/thisisawaveform/);
    });
  });

  describe('when the waveform is does not yet exist', () => {
    beforeEach(() => {
      getEtag.mockResolvedValue('thisisanetag');
    });

    describe('and file cannot be downloaded', () => {
      it('returns a 400 with error message', async () => {
        s3ReadFile.mockRejectedValue(new Error());
        downloadFile.mockRejectedValue(new Error());

        const response = await handler({
          queryStringParameters: {
            sourceUrl: 'https://get-it-here.com/my-audio-file.mp3',
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.body).toMatch(/Failed to download audio file/);
      });
    });

    describe('and the waveform cannot be generated form the file', () => {
      it('returns a 400 with error message', async () => {
        s3ReadFile.mockRejectedValue(new Error());
        generateWaveform.mockImplementation(() => {
          throw new Error();
        });

        const response = await handler({
          queryStringParameters: {
            sourceUrl: 'https://get-it-here.com/my-audio-file.mp3',
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.body).toMatch(/Failed to generate waveform from audio file/);
      });
    });

    describe('and the waveform is successfully generated', () => {
      it('returns a 200 with the waveform', async () => {
        s3ReadFile.mockRejectedValue(new Error());
        generateWaveform.mockReturnValue({ data: [1, 2, 3] });

        const response = await handler({
          queryStringParameters: {
            sourceUrl: 'https://get-it-here.com/my-audio-file.mp3',
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.body).toMatch(/data/);
      });
    });

    describe('audioOrigin', () => {
      afterEach(() => {
        config.allowedAudioOrigins = ['*'];
      });

      describe('when the sourceUrl is not an allowed origin', () => {
        it('returns a 400 with error message', async () => {
          config.allowedAudioOrigins = ['https://get-it-somewhere-else.com'];

          const response = await handler({
            queryStringParameters: {
              sourceUrl: 'https://get-it-here.com/my-audio-file.mp3',
            },
          });
          expect(response.statusCode).toBe(400);
          expect(response.body).toMatch(/origin/);
        });
      });

      describe('when the sourceUrl is an allowed origin', () => {
        it('returns a 200', async () => {
          config.allowedAudioOrigins = ['https://get-it-here.com'];

          const response = await handler({
            queryStringParameters: {
              sourceUrl: 'https://get-it-here.com/my-audio-file.mp3',
            },
          });

          expect(response.statusCode).toBe(200);
        });
      });

      describe('when the bearer token contains allowedAudioOrigins claim', () => {
        describe('when the sourceUrl is an allowed origin', () => {
          it('returns a 200', async () => {
            const response = await handler({
              queryStringParameters: {
                sourceUrl: 'https://get-it-here.com/my-audio-file.mp3',
                requestContext: {
                  authorizer: { allowedAudioOrigins: 'https://get-it-here.com' },
                },
              },
            });

            expect(response.statusCode).toBe(200);
          });
        });
      });
    });

    describe('inputFormat', () => {
      describe('when the inputFormat is provided', () => {
        it('returns a 200 when inputformat is valid', async () => {
          const response = await handler({
            queryStringParameters: {
              sourceUrl: 'https://get-it-here.com/my-audio-file.mp3',
              inputFormat: 'wav',
            },
          });

          expect(response.statusCode).toBe(200);
        });

        it('returns a 400 when inputformat is not valid', async () => {
          const response = await handler({
            queryStringParameters: {
              sourceUrl: 'https://get-it-here.com/my-audio-file.mp3',
              inputFormat: 'blah',
            },
          });

          expect(response.statusCode).toBe(400);
        });
      });

      describe('when the inputFormat is not provided', () => {
        it('returns a 200 when inputformat is valid', async () => {
          const response = await handler({
            queryStringParameters: {
              sourceUrl: 'https://get-it-here.com/my-audio-file.mp3',
            },
          });

          expect(response.statusCode).toBe(200);
        });

        it('returns a 400 when inputformat is not valid', async () => {
          const response = await handler({
            queryStringParameters: {
              sourceUrl: 'https://get-it-here.com/my-audio-file.blah',
            },
          });

          expect(response.statusCode).toBe(400);
        });
      });
    });

    describe('CORS', () => {
      describe('when a origin header is set', () => {
        beforeEach(() => {
          s3ReadFile.mockRejectedValue(new Error());
          generateWaveform.mockReturnValue({ data: [1, 2, 3] });
        });

        describe('when the allowed origin is a wildcard', () => {
          it('returns CORS headers', async () => {
            config.CORSAllowedOrigins = '*';

            const response = await handler({
              queryStringParameters: {
                sourceUrl: 'https://get-it-here.com/my-audio-file.mp3',
              },
              headers: {
                origin: 'anything',
              },
            });

            expect(response.headers['Access-Control-Allow-Origin']).toBe('anything');
            expect(response.headers['Access-Control-Max-Age']).toBe(86400);
          });
        });

        describe('when the origin is in allowed origins', () => {
          it('returns CORS headers', async () => {
            config.CORSAllowedOrigins = 'anything, andsomethingelse';

            const response = await handler({
              queryStringParameters: {
                sourceUrl: 'https://get-it-here.com/my-audio-file.mp3',
              },
              headers: {
                origin: 'anything',
              },
            });

            expect(response.headers['Access-Control-Allow-Origin']).toBe('anything');
            expect(response.headers['Access-Control-Max-Age']).toBe(86400);
          });
        });

        describe('when the origin is not in allowed origins', () => {
          it('does not return CORS headers', async () => {
            config.CORSAllowedOrigins = 'somethingspecific';

            const response = await handler({
              queryStringParameters: {
                sourceUrl: 'https://get-it-here.com/my-audio-file.mp3',
              },
              headers: {
                origin: 'somethingelse',
              },
            });

            expect(response.headers['Access-Control-Allow-Origin']).toBe(undefined);
            expect(response.headers['Access-Control-Max-Age']).toBe(undefined);
          });
        });
      });
    });
  });
});
