import { jsonResponse } from '../../../src/utils/http';

describe('jsonResponse', () => {
  it('serializa el body y fija el statusCode indicado', () => {
    const result = jsonResponse(201, { transcriptionId: 'tx-1' });

    expect(result.statusCode).toBe(201);
    expect(result.body).toBe(JSON.stringify({ transcriptionId: 'tx-1' }));
  });

  it('incluye las cabeceras CORS en toda respuesta', () => {
    const result = jsonResponse(404, { message: 'not found' });

    expect(result.headers).toEqual({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    });
  });
});
