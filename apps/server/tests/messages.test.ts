import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import type { LLMService } from '../src/llmService.js';

// Mock LLMService for testing purposes
const fakeLLM: LLMService = {
    chat: async () => 'mocked reply',
};

const app = createApp(fakeLLM);

beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/llm-chat-test');
});
afterAll(async () => {
    await mongoose.connection.db?.dropDatabase();
    await mongoose.disconnect();
});

describe('Message APIs (LLM mocked)', () => {
    it('POST message stores user msg and mocked assistant reply', async () => {
        const s = await request(app).post('/sessions').send({ title: 'chat' });
        const res = await request(app)
            .post(`/sessions/${s.body._id}/messages`)
            .send({ content: 'hello' });

        expect(res.status).toBe(201);
        expect(res.body.assistantMessage.content).toBe('mocked reply');
        expect(res.body.userMessage.role).toBe('user');
    });

    it('GET messages returns history in order', async () => {
        const s = await request(app).post('/sessions').send({ title: 'chat2' });
        await request(app).post(`/sessions/${s.body._id}/messages`).send({ content: 'first' });
        const res = await request(app).get(`/sessions/${s.body._id}/messages`);

        expect(res.status).toBe(200);
        expect(res.body[0].content).toBe('first');            // user
        expect(res.body[1].content).toBe('mocked reply');     // assistant
    });

    it('POST message to unknown session returns 404', async () => {
        const res = await request(app)
            .post('/sessions/000000000000000000000000/messages')
            .send({ content: 'x' });
        expect(res.status).toBe(404);
    });
});