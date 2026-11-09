import {
  PROTECTED_ERRORS,
  PUBLIC_ERRORS,
  buildErrorResponses,
  buildRequestBody,
  buildSuccessResponse,
} from './swagger.util';

class FixtureDto {}

const OPTIONS = {
  path: '/api/example',
  summary: 'Пример',
  operationDesc: 'Описание',
};

describe('swagger utils', () => {
  it('skips the body when no request dto is provided', () => {
    expect(buildRequestBody(OPTIONS)).toEqual([]);
  });

  it('builds a request body from a dto', () => {
    const decorators = buildRequestBody({
      ...OPTIONS,
      requestDto: FixtureDto,
      requestDescription: 'Тело запроса',
    });

    expect(decorators).toHaveLength(1);
  });

  it('builds a success response with an array flag', () => {
    expect(
      buildSuccessResponse(
        {
          ...OPTIONS,
          responseDto: FixtureDto,
          responseIsArray: true,
        },
        'Успех',
      ),
    ).toEqual({
      description: 'Успех',
      type: FixtureDto,
      isArray: true,
    });
  });

  it('adds typed public errors and merges overrides by status', () => {
    const defaults = buildErrorResponses(OPTIONS, 'GET', PUBLIC_ERRORS);
    const overridden = buildErrorResponses(
      {
        ...OPTIONS,
        errors: [{ status: 400, description: 'Своя ошибка', message: 'Текст' }],
      },
      'GET',
      PUBLIC_ERRORS,
    );

    expect(defaults).toHaveLength(PUBLIC_ERRORS.length);
    expect(overridden).toHaveLength(PUBLIC_ERRORS.length);
  });

  it('adds a specific error that is missing from the defaults', () => {
    const decorators = buildErrorResponses(
      {
        ...OPTIONS,
        errors: [{ status: 404, description: 'Не найдено' }],
      },
      'GET',
      PROTECTED_ERRORS,
    );

    expect(decorators).toHaveLength(PROTECTED_ERRORS.length + 1);
  });
});
