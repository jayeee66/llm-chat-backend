import OpenAI from 'openai';
import * as dotenv from 'dotenv/config';
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface LLMService {
    chat(messages: ChatMessage[]): Promise<string>;

}

export class NvidiaLLMService implements LLMService {
    private openai = new OpenAI({
        apiKey: process.env.NVIDIA_API_KEY,
        baseURL: 'https://integrate.api.nvidia.com/v1',
    })
    async chat(messages: ChatMessage[]): Promise<string> {
        const completion = await this.openai.chat.completions.create({
            model: 'meta/llama-3.1-8b-instruct',
            messages,
            max_tokens: 512,
        });
        // Return the content of the first choice, or an empty string if not available
        return completion.choices[0]?.message?.content ?? '';
    }

};