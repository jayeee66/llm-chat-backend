import express from 'express';
import { Session, Message } from './models.js';
// Import the LLMService interface to ensure the passed llm object adheres to the expected structure
import { LLMService } from './llmService.js';
// Import swagger-ui-express and the OpenAPI specification for API documentation
import swaggerUi from 'swagger-ui-express';
import openapi from './openapi.json' with { type: 'json' };



export function createApp(llm: LLMService) {
    const app = express();
    app.use(express.json());
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));

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

        // Create a new user message associated with the session
        const userMessage = await Message.create({ sessionId, role: 'user', content });

        // Get context of the session to send to the LLM service
        const history = await Message.find({ sessionId }).sort({ createdAt: 1 });
        const chatMessages = history.map(msg => ({ role: msg.role, content: msg.content }));

        // Call LLM service to get a reply based on the chat history
        const reply = await llm.chat(chatMessages);

        // Create a new assistant message with the reply associated with the session
        const assistantMessage = await Message.create({ sessionId, role: 'assistant', content: reply });

        res.status(201).json({ userMessage, assistantMessage });
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
    return app;
}