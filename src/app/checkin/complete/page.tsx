import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@takaki/go-design-system";
import CompleteContent from "./CompleteContent";

const FALLBACK_URL = "https://www.youtube.com/watch?v=LR6-B9ItZxE";

async function getMeditationUrl(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "meditation_url")
    .single();
  return data?.value ?? FALLBACK_URL;
}

export default async function CheckinCompletePage() {
  const meditationUrl = await getMeditationUrl();

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="記録完了" description="お疲れさまでした" />
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          </div>
        }
      >
        <CompleteContent meditationUrl={meditationUrl} />
      </Suspense>
    </div>
  );
}
