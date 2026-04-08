'use server';
/**
 * @fileOverview AI assistant for generating temple event and notice content.
 * 
 * - generateTempleContent - A function that handles the content generation process.
 * - GenerateContentInput - The input type for the generateTempleContent function.
 * - GenerateContentOutput - The return type for the generateTempleContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateContentInputSchema = z.object({
  topic: z.string().describe('A brief topic or keyword for the event or notice (e.g., "Holi 2025", "Bhandara on Sunday").'),
  type: z.enum(['event', 'notice']).describe('The type of content to generate.'),
  language: z.enum(['hi', 'en']).describe('The language for the generated content.'),
});

export type GenerateContentInput = z.infer<typeof GenerateContentInputSchema>;

const GenerateContentOutputSchema = z.object({
  title: z.string().describe('A catchy and respectful title for the content.'),
  content: z.string().describe('A detailed and professional description or message.'),
});

export type GenerateContentOutput = z.infer<typeof GenerateContentOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateTempleContentPrompt',
  input: { schema: GenerateContentInputSchema },
  output: { schema: GenerateContentOutputSchema },
  prompt: `You are an expert administrator for a traditional Indian Temple (Mandir).
Your goal is to write a respectful, professional, and inviting {{type}} for the "Mandir Samiti Bahpura".

Topic: {{{topic}}}
Language: {{language}}

If the language is "hi", use formal Hindi (Devanagari script).
If the language is "en", use formal and spiritual English.

The title should be brief and impactful.
The content should be welcoming, providing context about the spiritual significance of the topic.`,
});

const adminAiFlow = ai.defineFlow(
  {
    name: 'adminAiFlow',
    inputSchema: GenerateContentInputSchema,
    outputSchema: GenerateContentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

/**
 * Server Action to generate temple content using AI.
 */
export async function generateTempleContent(input: GenerateContentInput): Promise<GenerateContentOutput> {
  return adminAiFlow(input);
}
