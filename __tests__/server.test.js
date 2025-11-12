const request = require('supertest');
const app = require('../server');

describe('API endpoints', () => {
  test('GET /api/etchings returns array', async () => {
    const res = await request(app).get('/api/etchings');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  }, 10000);

  test('POST /api/partslog accepts entry and returns it', async () => {
    const payload = {
      part_name: 'UnitTestPart',
      etching: 'UT-1',
      current_move_date: '2025-11-12',
      submitted_by: 'UnitTest'
    };
    const res = await request(app).post('/api/partslog').send(payload);
    expect([200,201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('entry');
    expect(res.body.entry.part_name).toBe('UnitTestPart');
  }, 15000);
});
