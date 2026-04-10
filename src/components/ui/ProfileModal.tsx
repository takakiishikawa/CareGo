'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Bell, BellOff } from 'lucide-react';

interface ProfileModalProps {
  profile: { display_name: string | null; avatar_url: string | null } | null;
  userId: string;
  onClose: () => void;
}

const NOTIFICATION_HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(h: number) {
  return `${String(h).padStart(2, '0')}:00`;
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

  // 通知設定
  const [notificationTime, setNotificationTime] = useState(17);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    // 既存のサブスクリプション設定を取得
    fetch('/api/push/subscribe')
      .then(r => r.json())
      .then(({ subscription }) => {
        if (subscription) {
          setNotificationEnabled(true);
          setNotificationTime(subscription.notification_time ?? 17);
        }
      })
      .catch(() => {});
  }, []);

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
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
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
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: name, avatar_url: avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '保存に失敗しました');
      router.refresh();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnableNotification = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setError('このブラウザはプッシュ通知をサポートしていません');
      return;
    }
    setIsSubscribing(true);
    setNotificationStatus('idle');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('通知が許可されませんでした');
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error('VAPID公開鍵が設定されていません');

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          notification_time: notificationTime,
        }),
      });

      if (!res.ok) throw new Error('サブスクリプションの保存に失敗しました');

      setNotificationEnabled(true);
      setNotificationStatus('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '通知設定に失敗しました');
      setNotificationStatus('error');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDisableNotification = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
      await fetch('/api/push/subscribe', { method: 'DELETE' });
      setNotificationEnabled(false);
      setNotificationStatus('idle');
    } catch {
      setError('通知解除に失敗しました');
    }
  };

  const handleTimeChange = async (newTime: number) => {
    setNotificationTime(newTime);
    if (notificationEnabled) {
      // 時間だけ更新
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_time: newTime }),
      }).catch(() => {});
    }
  };

  const initials = (name || 'U').charAt(0).toUpperCase();

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'var(--overlay)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          borderRadius: '20px',
          padding: '32px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: 'var(--shadow-modal)',
          border: '0.5px solid var(--border-color)',
          margin: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>プロフィール編集</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-placeholder)', fontSize: '20px', lineHeight: 1, padding: '4px' }}
          >
            ×
          </button>
        </div>

        {/* アバター */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <button
            onClick={handleAvatarClick}
            disabled={isUploading}
            style={{
              position: 'relative', width: '80px', height: '80px', borderRadius: '50%',
              overflow: 'hidden', cursor: 'pointer', border: '2px solid var(--border-green)',
              background: 'var(--bg-green)', padding: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-green)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-green)'; }}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-green)' }}>{initials}</span>
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
          <p style={{ fontSize: '12px', color: 'var(--text-placeholder)', marginTop: '10px' }}>
            {isUploading ? 'アップロード中...' : 'クリックして画像を変更'}
          </p>
        </div>

        {/* 名前 */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            表示名
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="名前を入力"
            style={{
              width: '100%', border: '0.5px solid var(--border-color)',
              borderRadius: '10px', padding: '11px 14px',
              fontSize: '16px', color: 'var(--text-secondary)', background: 'var(--bg-card)',
              outline: 'none', transition: 'all 0.15s ease', boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent-green)'; e.target.style.boxShadow = '0 0 0 3px rgba(45,138,95,0.15)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* 通知設定 */}
        <div style={{
          marginBottom: '24px',
          padding: '18px',
          background: 'var(--bg-subtle)',
          borderRadius: '12px',
          border: '0.5px solid var(--border-color)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Bell size={15} strokeWidth={2} color="var(--accent-green)" />
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>通知設定</span>
            {notificationEnabled && (
              <span style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: '9999px',
                background: 'var(--bg-green)', color: 'var(--text-green-dark)',
                border: '0.5px solid var(--border-green)', fontWeight: 500,
              }}>
                ON
              </span>
            )}
          </div>

          {/* 通知時間 */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              通知時間
            </label>
            <select
              value={notificationTime}
              onChange={e => handleTimeChange(Number(e.target.value))}
              style={{
                width: '100%', border: '0.5px solid var(--border-color)',
                borderRadius: '8px', padding: '9px 12px',
                fontSize: '15px', color: 'var(--text-secondary)', background: 'var(--bg-card)',
                outline: 'none', cursor: 'pointer', boxSizing: 'border-box',
              }}
            >
              {NOTIFICATION_HOURS.map(h => (
                <option key={h} value={h}>{formatHour(h)}</option>
              ))}
            </select>
          </div>

          {notificationEnabled ? (
            <button
              onClick={handleDisableNotification}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                background: 'var(--bg-amber)', color: 'var(--text-amber-dark)',
                border: '0.5px solid var(--border-amber)', borderRadius: '8px', padding: '10px',
                fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease',
              }}
            >
              <BellOff size={14} strokeWidth={2} />
              通知を無効にする
            </button>
          ) : (
            <button
              onClick={handleEnableNotification}
              disabled={isSubscribing}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                background: isSubscribing ? 'var(--bg-muted)' : 'var(--accent-green)',
                color: 'white', border: 'none', borderRadius: '8px', padding: '10px',
                fontSize: '14px', fontWeight: 500,
                cursor: isSubscribing ? 'not-allowed' : 'pointer', transition: 'all 0.15s ease',
              }}
            >
              <Bell size={14} strokeWidth={2} />
              {isSubscribing ? '設定中...' : '通知を有効にする'}
            </button>
          )}

          {notificationStatus === 'success' && (
            <p style={{ fontSize: '12px', color: 'var(--text-green)', marginTop: '8px', textAlign: 'center' }}>
              通知を設定しました（{formatHour(notificationTime)}）
            </p>
          )}
        </div>

        {error && (
          <div style={{ color: 'var(--text-error)', fontSize: '14px', marginBottom: '16px', background: 'var(--bg-amber)', padding: '10px 14px', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving || isUploading}
          style={{
            width: '100%', background: 'var(--accent-green)', color: 'white',
            border: 'none', borderRadius: '10px', padding: '13px',
            fontSize: '16px', fontWeight: 500,
            cursor: (isSaving || isUploading) ? 'not-allowed' : 'pointer',
            opacity: (isSaving || isUploading) ? 0.7 : 1,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { if (!isSaving && !isUploading) (e.currentTarget as HTMLElement).style.background = 'var(--accent-green-hover)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-green)'; }}
          onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
          onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
        >
          {isSaving ? '保存中...' : '保存する'}
        </button>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}
