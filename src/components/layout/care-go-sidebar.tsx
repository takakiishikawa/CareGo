"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  UserMenu,
} from "@takaki/go-design-system";
import {
  LayoutDashboard,
  PenLine,
  BarChart3,
  Lightbulb,
  Sun,
  Moon,
  Leaf,
  ChevronsUpDown,
  Check,
  UserCog,
} from "lucide-react";

const ProfileEditDialog = dynamic(() => import("./ProfileEditDialog"), {
  ssr: false,
});

const GO_APPS = [
  {
    name: "NativeGo",
    url: "https://english-learning-app-black.vercel.app/",
    color: "var(--color-primary)",
  },
  {
    name: "CareGo",
    url: "https://care-go-mu.vercel.app/dashboard",
    color: "var(--color-success)",
  },
  {
    name: "KenyakuGo",
    url: "https://kenyaku-go.vercel.app/",
    color: "var(--color-warning)",
  },
  {
    name: "TaskGo",
    url: "https://taskgo-dun.vercel.app/",
    color: "var(--color-accent)",
  },
  {
    name: "CookGo",
    url: "https://cook-go-lovat.vercel.app/dashboard",
    color: "var(--color-info)",
  },
  {
    name: "PhysicalGo",
    url: "https://physical-go.vercel.app/dashboard",
    color: "var(--color-error)",
  },
] as const;

const CURRENT_APP = "CareGo";

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/checkin", label: "チェックイン", icon: PenLine },
  { href: "/reports", label: "週次レポート", icon: BarChart3 },
];

function isActive(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function CareGoSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [hasOpenedProfile, setHasOpenedProfile] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      createClient()
        .auth.getUser()
        .then(({ data: { user } }) => {
          if (!user) return;
          setDisplayName(
            user.user_metadata?.display_name ||
              user.email?.split("@")[0] ||
              "User",
          );
          setEmail(user.email || "");
          setAvatarUrl(user.user_metadata?.avatar_url || "");
        });
    });
    const update = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  const toggleTheme = useCallback(() => {
    const next = isDark ? "light" : "dark";
    localStorage.setItem("carego-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }, [isDark]);

  const openProfile = useCallback(() => {
    setHasOpenedProfile(true);
    setProfileOpen(true);
  }, []);

  const handleSignOut = useCallback(async () => {
    const { createClient } = await import("@/lib/supabase/client");
    await createClient().auth.signOut();
    window.location.href = "/login";
  }, []);

  const userMenuItems = useMemo(
    () => [
      {
        title: "プロフィール編集",
        icon: UserCog,
        onSelect: openProfile,
      },
      {
        title: "コンセプト",
        icon: Lightbulb,
        onSelect: () => router.push("/concept"),
        isActive: pathname.startsWith("/concept"),
      },
      {
        title: isDark ? "ダーク" : "ライト",
        icon: isDark ? Moon : Sun,
        onSelect: toggleTheme,
      },
    ],
    [isDark, openProfile, toggleTheme, pathname, router],
  );

  const signOutConfig = useMemo(
    () => ({ onSelect: handleSignOut }),
    [handleSignOut],
  );

  return (
    <>
      <Sidebar>
        {/* ヘッダー：ロゴ + アプリ切り替え */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="flex items-center justify-center rounded-md bg-primary p-1.5 shrink-0">
                      <Leaf className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none min-w-0">
                      <span className="text-xs text-muted-foreground">App</span>
                      <span className="text-[15px] font-medium tracking-tight truncate">
                        CareGo
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-52"
                  align="start"
                  side="bottom"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Goシリーズ
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {GO_APPS.map((app) => (
                    <DropdownMenuItem
                      key={app.name}
                      onSelect={() => {
                        window.location.href = app.url;
                      }}
                      className="gap-2"
                    >
                      <span
                        className="shrink-0 rounded-full"
                        style={{
                          width: 8,
                          height: 8,
                          backgroundColor: app.color,
                        }}
                        aria-hidden
                      />
                      <span className="flex-1">{app.name}</span>
                      {app.name === CURRENT_APP && (
                        <Check className="h-4 w-4 shrink-0 opacity-70" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* メインナビ */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map(({ href, label, icon: Icon }) => (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(href, pathname)}
                    >
                      <Link href={href}>
                        <Icon className="h-4 w-4 shrink-0" />
                        {label}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* フッター */}
        <SidebarFooter>
          <UserMenu
            displayName={displayName || "\u2014"}
            email={email}
            avatarUrl={avatarUrl}
            items={userMenuItems}
            signOut={signOutConfig}
          />
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {hasOpenedProfile && (
        <ProfileEditDialog
          open={profileOpen}
          onOpenChange={setProfileOpen}
          displayName={displayName}
          onDisplayNameChange={setDisplayName}
          avatarUrl={avatarUrl}
          onAvatarUrlChange={setAvatarUrl}
        />
      )}
    </>
  );
}
