import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  }

  const { email, password, nome, pode_dirigir } = await req.json();

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }

  // Insert into usuarios
  const { error: dbError } = await supabaseAdmin.from("usuarios").insert({
    id: authData.user.id,
    nome,
    email,
    tipo: "admin",
    pode_dirigir: pode_dirigir ?? true,
    ativo: true,
  });

  if (dbError) {
    return new Response(JSON.stringify({ error: dbError.message }), { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }

  return new Response(JSON.stringify({ success: true, user_id: authData.user.id }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});
