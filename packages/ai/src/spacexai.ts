import type { AIAnswer, CanonicalDocument } from '@locked-in/types';
import {
  GROUNDED_SYSTEM,
  wrapUntrustedContext,
  type AIProvider,
  type GenerateInput,
} from './provider.js';

export interface SpaceXAIOptions {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

export class SpaceXAIProvider implements AIProvider {
  readonly id = 'spacexai';
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: SpaceXAIOptions) {
    this.baseUrl = (options.baseUrl ?? 'https://api.x.ai/v1').replace(/\/$/, '');
    this.model = options.model ?? 'grok-4.5';
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async generate(input: GenerateInput): Promise<AIAnswer> {
    const body = {
      model: input.model ?? this.model,
      input: [
        {
          role: 'system',
          content: input.system ?? GROUNDED_SYSTEM,
        },
        {
          role: 'user',
          content: `${input.prompt}\n\n${wrapUntrustedContext(input.context)}`,
        },
      ],
    };
    const response = await this.fetchImpl(`${this.baseUrl}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      throw new Error(`SpaceXAI request failed (${response.status})`);
    }
    const json = (await response.json()) as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
    const text =
      json.output_text ??
      json.output?.flatMap((item) => item.content ?? []).map((part) => part.text ?? '').join('\n') ??
      '';
    if (!text) throw new Error('SpaceXAI returned an empty or malformed response');
    return {
      text,
      citations: input.citations ?? [],
      provider: this.id,
      model: this.model,
      grounded: (input.citations?.length ?? 0) > 0,
      retrievedContext: input.context,
    };
  }

  async summarize(document: CanonicalDocument): Promise<AIAnswer> {
    const context = document.blocks.slice(0, 12).map((block) => block.text);
    return this.generate({
      prompt: `Summarize this document in 5 short bullets. Title: ${document.metadata.title}`,
      context,
      citations: [
        {
          documentId: document.id,
          title: document.metadata.title,
          excerpt: context[0] ?? document.metadata.title,
        },
      ],
    });
  }
}
