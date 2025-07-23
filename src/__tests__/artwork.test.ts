import request from 'supertest';
import { app } from '../index';
import { users } from '../models/user';
import { ddbDocClient } from '../lib/dynamoDBClient'; // Import the REAL client
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
}));
const ddbMock = mockClient(ddbDocClient);

describe('Artwork API Tests', () => {
  let testArtworkSk = '';
  const testUserSk = 'user-1234';

  const validArtwork = {
    f_name: 'John',
    l_name: 'Doe',
    age: 12,
    description: 'A beautiful piece of art.',
    sport: 'Basketball',
    location: 'New York',
    is_ai_gen: false,
    model: 'Art',
    prompt: 'A child playing basketball',
    file_type: 'jpg',
  };

  beforeAll(async () => {
    users[testUserSk] = {
      sk: testUserSk,
      pk: 'USER',
      f_name: 'Test',
      l_name: 'User',
      email: 'test@example.com',
      can_submit_art: true,
      has_active_submission: false,
      voted_sk: '', 
    };
  
    await request(app)
      .post('/api/artworks')
      .send(validArtwork);
  });
  beforeEach(() => {
    ddbMock.reset();
  });


  test('POST /api/artworks - should create artwork', async () => {
    const res = await request(app)
      .post('/api/artworks')
      .send(validArtwork);
  
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message');
  });

  test('GET /api/artworks - should fetch artworks', async () => {
    const res = await request(app).get('/api/artworks');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length) {
      testArtworkSk = res.body[0].sk;
    }
  });

  test('GET /api/artworks/:artworkSk - should fetch specific artwork', async () => {
    const res = await request(app).get(`/api/artworks/${testArtworkSk}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('sk', testArtworkSk);
  });

  test('PATCH /api/artworks/:artworkSk - should approve artwork', async () => {
    const res = await request(app)
      .patch(`/api/artworks/${testArtworkSk}`)
      .send({ is_approved: true });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('is_approved', true);
  });

  test('PATCH /api/vote/:artworkSk - should add a vote', async () => {
    // const res = await request(app)
    //   .patch(`/api/vote/${testArtworkSk}`)
    //   .send({ userSk: 'user-1234' }); // adjust to match your logic
    // expect(res.statusCode).toBe(200);

       ddbMock.on(GetCommand).resolves({
          Item: users[testUserSk],
        });
    
        // ACT: Call the API endpoint.
        // The controller for this endpoint will call `getUserBySk`, which in turn
        // calls `ddbDocClient.send()`. Our mock will intercept that call.
        const res = await request(app)
          .patch(`/api/vote/${testArtworkSk}`)
          .send({ userSk: testUserSk });
    
        // ASSERT: Verify the result.
        expect(res.statusCode).toBe(200);
    
        // Verify that the database was queried correctly.
        const sentCommand = ddbMock.commandCalls(GetCommand)[0].args[0].input;
        expect(sentCommand.Key).toEqual({
          pk: 'USER',
          sk: testUserSk
      });
  });

  test('DELETE /api/artworks/:artworkSk - should delete artwork', async () => {
    const res = await request(app).delete(`/api/artworks/${testArtworkSk}`);
    expect(res.statusCode).toBe(200);
  });

  test('GET /api/votes - should return total votes', async () => {
    const res = await request(app).get('/api/votes');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('votes', 1);
  });
});

