import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import type { LLMService } from '../src/llmService.js';

// Mock LLMService for testing purposes
const fakeLLM: LLMService = {
    chat: async (model, messages) => 'mocked reply',
};

// A broken LLM service used to simulate an external API failure
const brokenLLM: LLMService = {
    chat: async () => { throw new Error('LLM unavailable'); },
};

const app = createApp(fakeLLM);
const brokenApp = createApp(brokenLLM);

beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/llm-chat-test');
});
afterAll(async () => {
    await mongoose.connection.db?.dropDatabase();
    await mongoose.disconnect();
});

describe('Message APIs (LLM mocked)', () => {
    it('POST message stores user msg and mocked assistant reply', async () => {
        // Create a new session first
        const s = await request(app).post('/sessions').send({ title: 'chat' });
        // Post a message to the session
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

    it('POST message with malformed sessionId returns 404', async () => {
        const res = await request(app)
            .post('/sessions/not-a-valid-id/messages')
            .send({ content: 'x' });
        expect(res.status).toBe(404);
    });

    it('POST message with empty content returns 400', async () => {
        const s = await request(app).post('/sessions').send({ title: 'validation test' });
        const res = await request(app)
            .post(`/sessions/${s.body._id}/messages`)
            .send({ content: '' });
        expect(res.status).toBe(400);
    });

    it('POST message with missing content returns 400', async () => {
        const s = await request(app).post('/sessions').send({ title: 'validation test 2' });
        const res = await request(app)
            .post(`/sessions/${s.body._id}/messages`)
            .send({});
        expect(res.status).toBe(400);
    });

    it('does not persist any message if the LLM call fails', async () => {
        const s = await request(brokenApp).post('/sessions').send({ title: 'fail test' });

        // This call is expected to fail internally since the LLM throws
        await request(brokenApp)
            .post(`/sessions/${s.body._id}/messages`)
            .send({ content: 'hello' })
            .catch(() => { });

        // Key assertion: persistence happens AFTER a successful LLM reply,
        // so a failed call should leave no orphaned user message behind
        const messages = await request(brokenApp).get(`/sessions/${s.body._id}/messages`);
        expect(messages.body.length).toBe(0);
    });
});