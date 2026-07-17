import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';

// Mock LLMService for testing purposes
const fakeLLM = {
    chat: async () => 'mocked reply',
};

const app = createApp(fakeLLM);

beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/llm-chat-test');  // test database
});

afterAll(async () => {
    await mongoose.connection.db?.dropDatabase();  // clean up the test database after tests
    await mongoose.disconnect();
});

describe('Session APIs', () => {
    it('POST /sessions creates a session', async () => {
        const res = await request(app).post('/sessions').send({ title: 'test' });
        expect(res.status).toBe(201);
        expect(res.body.title).toBe('test');
    });

    it('GET /sessions returns the list', async () => {
        const res = await request(app).get('/sessions');
        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it('DELETE unknown session returns 404', async () => {
        const res = await request(app).delete('/sessions/000000000000000000000000');
        expect(res.status).toBe(404);
    });
});