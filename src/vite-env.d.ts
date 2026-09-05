/// <reference types="vite/client" />

declare module '*?url' {
  const value: string;
  export default value;
}

declare module 'mammoth/mammoth.browser' {
  const mammoth: {
    extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string; messages: unknown[] }>;
  };
  export default mammoth;
}
