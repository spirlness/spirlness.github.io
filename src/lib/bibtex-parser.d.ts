// Hand-written because @retorquere/bibtex-parser 10.x ships a broken `types`
// field (points at dist/types/index.d.ts, which is absent from the tarball).
declare module "@retorquere/bibtex-parser" {
  export interface BibtexEntry {
    type: string;
    key: string;
    fields: Record<string, string>;
    mode: Record<string, unknown>;
    input: string;
  }

  export interface BibtexParseResult {
    entries: BibtexEntry[];
    errors: Array<{ error: string; input?: string }>;
    comments: unknown[];
    strings: Record<string, string>;
    preamble: unknown[];
  }

  export function parse(
    input: string,
    options?: {
      sentenceCase?: false;
      verbatimFields?: Array<string | RegExp>;
    }
  ): BibtexParseResult;
  export function parseAsync(input: string, options?: Record<string, unknown>): Promise<BibtexParseResult>;
}
