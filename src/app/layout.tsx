The file path in the error (`src/app/layout.tsx`) doesn't exist here, but I have the content from the prompt. The fix is to remove the two missing imports and their JSX usages since those components don't exist in the codebase.

```tsx
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { DesignTokens, AppLayout, Toaster } from "@takaki/go-design-system";
import { Analytics } from "@vercel/analytics/react";
import { CareGoSidebar } from "@/components/layout/care-go-sidebar";
import { createClient } from "@/lib/supabase/server";

const dmSans = DM_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareGo",
  description: "良いコンディションの安定を、AIと一緒に作る",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="ja"
      className={`${dmSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#2D8A5F" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CareGo" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <DesignTokens primaryColor="#2D8A5F" primaryColorHover="#226b49" />
        {/* Dark mode init: class-based for go-design-system compatibility */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('carego-theme');if(s==='dark'){document.documentElement.classList.add('dark');}else if(s==='light'){document.documentElement.classList.remove('dark');}else{var h=(new Date().getUTCHours()+7)%24;if(h>=18||h<6){document.documentElement.classList.add('dark');}}}catch(e){}})();`,
          }}
        />
        {/* Sidebar accent color for CareGo (green) */}
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--sidebar-accent:142 60% 93%;--sidebar-accent-foreground:152 60% 25%}.dark{--sidebar-accent:150 30% 16%;--sidebar-accent-foreground:142 40% 75%}`,
          }}
        />
      </head>
      <body className="min-h-full">
        {user ? (
          <AppLayout sidebar={<CareGoSidebar />}>{children}</AppLayout>
        ) : (
          <main>{children}</main>
        )}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}