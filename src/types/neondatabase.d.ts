declare module '@neondatabase/serverless' {
  export function neon(
    databaseUrl: string
  ): (strings: TemplateStringsArray | string, ...values: any[]) => Promise<any[]>;
}