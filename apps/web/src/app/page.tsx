import { testSupabaseConnection } from "../lib/test-supabase";

export default async function Home() {
  await testSupabaseConnection();

  return (
    <main>
      <h1>LookUp Connected</h1>
    </main>
  );
}