import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { NvidiaLLMService } from './llmService.js';
// Create an instance of the NvidiaLLMService
const app = createApp(new NvidiaLLMService());

const PORT = process.env.PORT ?? 3000;

await mongoose.connect(process.env.MONGO_URI!);
console.log('Mongo connected');

app.listen(PORT, () => console.log(`Server is running on :${PORT}`));