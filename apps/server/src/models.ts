import mongoose, { Schema, model } from 'mongoose';

const sessionSchema = new Schema(
    { title: { type: String, default: 'New Chat' } },
    { timestamps: true },
);

const messageSchema = new Schema(
    {
        // Each message is associated with a session        
        sessionId: {
            type: Schema.Types.ObjectId,
            // Reference to the Session document, index for faster queries, 
            // and required to ensure every message belongs to a session
            ref: 'Session', required: true, index: true
        },
        // The role of the message sender (user or assistant)
        role: {
            type: String,
            // The role of the message sender (user or assistant)
            enum: ['user', 'assistant'], required: true
        },
        content: { type: String, required: true },
    },
    { timestamps: true },
);

export const Session = model('Session', sessionSchema);
export const Message = model('Message', messageSchema);