import express from 'express';
import { Session, Message } from './models.js';

export const app = express();
app.use(express.json());

app.post('/sessions', async (req, res) => {
    const session = await Session.create({ title: req.body?.title });
    res.status(201).json(session);
});

app.get('/sessions', async (_req, res) => {
    const sessions = await Session.find().sort({ updatedAt: -1 });
    res.json(sessions);
});

app.get('/sessions/:sessionId/messages', async (req, res) => {
    const { sessionId } = req.params;
    const messages = await Message.find({ sessionId }).sort({ createdAt: 1 });
    res.json(messages);
});

// post message to a session
app.post('/sessions/:sessionId/messages', async (req, res) => {
    const { sessionId } = req.params;
    const { role, content } = req.body;

    // Validate the sessionId
    const session = await Session.findById(sessionId);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }

    // Create a new message associated with the session
    const message = await Message.create({ sessionId, role, content });
    res.status(201).json(message);
});

app.delete('/sessions/:sessionId', async (req, res) => {
    const { sessionId } = req.params;

    // Validate the sessionId
    const session = await Session.findById(sessionId);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }

    // Delete all messages associated with the session
    await Message.deleteMany({ sessionId });

    // Delete the session itself
    await Session.findByIdAndDelete(sessionId);

    res.status(204).send();
});