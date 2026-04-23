import { createClient } from "@/lib/supabase/server"; // anon key — 認証確認用
import { createAdminClient } from "@/lib/supabase/admin"; // service_role key — DB操作用
import { NextResponse } from "next/server";

export async function GET() {
  // anon クライアントで認証確認
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // admin クライアントで取得（RLS バイパス、user.id でスコープ）
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  return NextResponse.json({ profile: data });
}

export async function PUT(request: Request) {
  // 1. anon クライアントで認証確認（JWT from cookies）
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { display_name, avatar_url } = body;

  // 2. admin クライアントで upsert（service_role key → RLS バイパス）
  //    id: user.id を明示することで、認証済みユーザーのレコードのみ操作
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .upsert(
      {
        id: user.id, // ← 認証済みユーザーの ID を明示
        display_name,
        avatar_url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
