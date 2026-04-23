import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { CheckinTiming } from "@/lib/types";

const VALID_TIMINGS: CheckinTiming[] = ["morning", "checkout"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { timing, checkin_id } = body;

  if (!timing || !VALID_TIMINGS.includes(timing)) {
    return NextResponse.json({ error: "Invalid timing" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("meditation_logs")
    .insert({
      user_id: user.id,
      timing,
      checkin_id: checkin_id ?? null,
      logged_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ meditation_log: data });
}
