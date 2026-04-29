"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
} from "@takaki/go-design-system";
import { createClient } from "@/lib/supabase/client";

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayName: string;
  onDisplayNameChange: (next: string) => void;
  avatarUrl: string;
  onAvatarUrlChange: (next: string) => void;
}

export default function ProfileEditDialog({
  open,
  onOpenChange,
  displayName,
  onDisplayNameChange,
  avatarUrl,
  onAvatarUrlChange,
}: ProfileEditDialogProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editName, setEditName] = useState(displayName);
  const [previewUrl, setPreviewUrl] = useState(avatarUrl);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (open) {
      setEditName(displayName);
      setPreviewUrl(avatarUrl);
      setPendingFile(null);
      setUploadError("");
    }
  }, [open, displayName, avatarUrl]);

  const initials = (editName || displayName || "U").charAt(0).toUpperCase();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadError("");
  }

  async function handleSave() {
    setSaving(true);
    setUploadError("");
    try {
      let finalUrl = avatarUrl;
      if (pendingFile) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not logged in");
        const ext = pendingFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/avatar.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, pendingFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(path);
        finalUrl = urlData.publicUrl;
      }
      const { error } = await supabase.auth.updateUser({
        data: { display_name: editName.trim(), avatar_url: finalUrl },
      });
      if (error) throw error;
      onDisplayNameChange(editName.trim() || displayName);
      onAvatarUrlChange(finalUrl);
      onOpenChange(false);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "保存に失敗しました");
    }
    setSaving(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onOpenChange(false);
      }}
    >
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>プロフィール編集</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full overflow-hidden shrink-0 bg-primary flex items-center justify-center">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="avatar"
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-white text-lg font-medium">
                  {initials}
                </span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{editName || "\u2014"}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-auto p-0 text-xs text-primary hover:underline"
              >
                画像を変更
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">表示名</label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="表示名を入力"
            />
          </div>
          {uploadError && (
            <p className="text-xs text-destructive">{uploadError}</p>
          )}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
