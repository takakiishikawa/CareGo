'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface ProfileModalProps {
  profile: { display_name: string | null; avatar_url: string | null } | null;
  userId: string;
  onClose: () => void;
}

export default function ProfileModal({ profile, userId, onClose }: ProfileModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(profile?.display_name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [previewUrl, setPreviewUrl] = useState(profile?.avatar_url ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const filePath = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      setPreviewUrl(publicUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const supabase = createClient();

      // ブラウザクライアントで auth.uid() を確実にセットするため、
      // user.id を明示的に取得してから upsert する
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ログインが必要です');

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,          // ← RLS の auth.uid() = id を満たすために必須
            display_name: name,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (upsertError) throw upsertError;

      router.refresh();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = (name || 'U').charAt(0).toUpperCase();

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(26, 24, 21, 0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '36px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1A1815', margin: 0 }}>プロフィール編集</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A09B92', fontSize: '20px', lineHeight: 1, padding: '4px' }}
          >
            ×
          </button>
        </div>

        {/* アバター */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
          <button
            onClick={handleAvatarClick}
            disabled={isUploading}
            style={{
              position: 'relative', width: '80px', height: '80px', borderRadius: '50%',
              overflow: 'hidden', cursor: 'pointer', border: '2px solid #9AD4B3',
              background: '#E8F5EF', padding: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2D8A5F'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#9AD4B3'; }}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '28px', fontWeight: 600, color: '#2D8A5F' }}>{initials}</span>
            )}
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 0.15s ease',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}
            >
              <span style={{ color: 'white', fontSize: '12px', fontWeight: 500 }}>変更</span>
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          <p style={{ fontSize: '12px', color: '#A09B92', marginTop: '10px' }}>
            {isUploading ? 'アップロード中...' : 'クリックして画像を変更'}
          </p>
        </div>

        {/* 名前 */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#2E2B28', marginBottom: '8px' }}>
            表示名
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="名前を入力"
            style={{
              width: '100%', border: '0.5px solid var(--border-color)',
              borderRadius: '10px', padding: '11px 14px',
              fontSize: '16px', color: '#2E2B28', background: '#FFFFFF',
              outline: 'none', transition: 'all 0.15s ease',
            }}
            onFocus={e => { e.target.style.borderColor = '#4DAF80'; e.target.style.boxShadow = '0 0 0 3px rgba(45,138,95,0.15)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {error && (
          <div style={{ color: '#C0392B', fontSize: '14px', marginBottom: '16px', background: '#FDF3E3', padding: '10px 14px', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving || isUploading}
          style={{
            width: '100%', background: '#2D8A5F', color: 'white',
            border: 'none', borderRadius: '10px', padding: '13px',
            fontSize: '16px', fontWeight: 500,
            cursor: (isSaving || isUploading) ? 'not-allowed' : 'pointer',
            opacity: (isSaving || isUploading) ? 0.7 : 1,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { if (!isSaving && !isUploading) (e.currentTarget as HTMLElement).style.background = '#1A5C3E'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#2D8A5F'; }}
          onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
          onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
        >
          {isSaving ? '保存中...' : '保存する'}
        </button>
      </div>
    </div>
  );
}
