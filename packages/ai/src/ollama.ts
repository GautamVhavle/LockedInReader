import type { AIAnswer, CanonicalDocument } from '@locked-in/types';
import {
  GROUNDED_SYSTEM,
  wrapUntrustedContext,
  type AIProvider,
  type GenerateInput,
} from './provider.js';

export class OllamaProvider implements AIProvider {
  readonly id = 'ollama';
  constructor(
    private readonly baseUrl = 'http://127.0.0.1:11434',
    private readonly model = 'llama3.2',
  ) {}

  async generate(input: GenerateInput): Promise<AIAnswer> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: input.model ?? this.model,
        stream: false,
        prompt: `${input.system ?? GROUNDED_SYSTEM}\n\n${input.prompt}\n\n${wrapUntrustedContext(input.context)}`,
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) throw new Error(`Ollama request failed (${response.status})`);
    const json = (await response.json()) as { response?: string };
    if (!json.response) throw new Error('Ollama returned a malformed response');
    return {
      text: json.response,
      citations: input.citations ?? [],
      provider: this.id,
      model: this.model,
      grounded: (input.citations?.length ?? 0) > 0,
      retrievedContext: input.context,
    };
  }

  async summarize(document: CanonicalDocument): Promise<AIAnswer> {
    return this.generate({
      prompt: `Summarize: ${document.metadata.title}`,
      context: document.blocks.slice(0, 8).map((block) => block.text),
      citations: [
        {
          documentId: document.id,
          title: document.metadata.title,
          excerpt: document.blocks[0]?.text ?? '',
        },
      ],
    });
  }
}
