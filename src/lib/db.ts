import { neon } from '@neondatabase/serverless';

let cachedClient: ((strings: TemplateStringsArray | string, ...values: any[]) => Promise<any[]>) | null = null;

export async function sql(strings: TemplateStringsArray | string, ...values: any[]): Promise<any[]> {
  const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || '';
  if (!databaseUrl) {
    throw new Error('Neon DATABASE_URL is missing in environment variables.');
  }
  if (!cachedClient) {
    cachedClient = neon(databaseUrl);
  }
  return (await cachedClient(strings, ...values)) as any[];
}

let tablesInitialized = false;
let initPromise: Promise<void> | null = null;

export async function ensureTablesExist() {
  if (tablesInitialized) return;
  if (initPromise) return initPromise;

  tablesInitialized = true;

  initPromise = (async () => {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS complaints (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          item_name TEXT NOT NULL,
          class_name TEXT NOT NULL,
          department TEXT NOT NULL,
          floor TEXT NOT NULL,
          description TEXT NOT NULL,
          photo_url TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          priority TEXT NOT NULL DEFAULT 'medium',
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        ALTER TABLE complaints ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

        CREATE TABLE IF NOT EXISTS lost_items (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          item_name TEXT NOT NULL,
          color TEXT NOT NULL,
          brand TEXT,
          location TEXT NOT NULL,
          remark TEXT,
          owner_name TEXT NOT NULL,
          phone TEXT NOT NULL,
          image_url TEXT,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS found_items (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          item_name TEXT NOT NULL,
          color TEXT NOT NULL,
          brand TEXT,
          location TEXT,
          remark TEXT,
          finder_name TEXT NOT NULL,
          phone TEXT NOT NULL,
          image_url TEXT,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS matched_items (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          lost_item_id UUID REFERENCES lost_items(id) ON DELETE CASCADE,
          found_item_id UUID REFERENCES found_items(id) ON DELETE CASCADE,
          match_score NUMERIC NOT NULL,
          lost_item_data JSONB NOT NULL,
          found_item_data JSONB NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS resources (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          uploader_name TEXT NOT NULL,
          course_name TEXT NOT NULL,
          subject_name TEXT NOT NULL,
          file_url TEXT NOT NULL,
          file_name TEXT NOT NULL,
          tips TEXT,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
    } catch (err) {
      tablesInitialized = false;
      console.error('Failed to ensure Neon database tables exist:', err);
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}