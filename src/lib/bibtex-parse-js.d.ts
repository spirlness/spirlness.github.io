declare module 'bibtex-parse-js' {
  export function toJSON(bibtex: string): any[];
  export function toBibtex(json: any[]): string;
}
