import { supabase } from "@lookup/services";

export async function testSupabaseConnection() {
  const { data, error } = await supabase
    .from("profiles_public")
    .select("*")
    .limit(1);

  console.log("SUPABASE DATA:", data);
  console.log("SUPABASE ERROR:", error);
}