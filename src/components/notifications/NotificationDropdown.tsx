import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bell, CheckCheck, CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react';
import type { AccountNotification } from '@/services/data-sync/notificationService';
import { NotificationService } from '@/services/data-sync/notificationService';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

const TYPE_META: Record<AccountNotification['type'], { icon: React.ReactNode; cls: string }> = {
  success: {
    icon: <CheckCircle2 size={14} />,
    cls: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
  info: {
    icon: <Info size={14} />,
    cls: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  warning: {
    icon: <AlertTriangle size={14} />,
    cls: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  error: {
    icon: <XCircle size={14} />,
    cls: 'bg-rose-50 text-rose-600 border-rose-200',
  },
};

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose, anchorRef }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<AccountNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError('');
    NotificationService.list(20)
      .then((data) => setItems(data))
      .catch(() => setError('Không thể tải thông báo. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose, anchorRef]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await NotificationService.markAllRead();
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkOne = async (id: string) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, read: true } : item));
    try { await NotificationService.markRead(id); } catch { /* optimistic — ignore */ }
  };

  if (!isOpen) return null;

  const unread = items.filter((n) => !n.read).length;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-[calc(100%+8px)] z-[90] flex w-[360px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.14)]"
      role="dialog"
      aria-label="Thông báo"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <Bell size={15} className="shrink-0 text-slate-400" />
        <span className="flex-1 text-[14px] font-bold text-slate-900">Thông báo</span>
        {unread > 0 && (
          <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
        {unread > 0 && (
          <button
            type="button"
            onClick={() => void handleMarkAll()}
            disabled={markingAll}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {markingAll ? <Loader2 size={11} className="animate-spin" /> : <CheckCheck size={11} />}
            Đọc hết
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="custom-scrollbar max-h-[420px] overflow-y-auto">
        {loading && (
          <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-[12px]">Đang tải thông báo…</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
            <AlertTriangle size={22} className="text-amber-400" />
            <span className="text-[12px] text-center">{error}</span>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
            <Bell size={22} className="text-slate-300" />
            <span className="text-[12px]">Chưa có thông báo nào</span>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <ul>
            {items.map((item) => {
              const meta = TYPE_META[item.type] || TYPE_META.info;
              return (
                <li
                  key={item.id}
                  className={`group flex gap-3 border-b border-slate-50 px-4 py-3 transition ${item.read ? 'bg-white' : 'bg-blue-50/40'}`}
                >
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border ${meta.cls}`}>
                    {meta.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13px] font-semibold leading-5 ${item.read ? 'text-slate-700' : 'text-slate-900'}`}>
                      {item.title}
                    </p>
                    {item.message && (
                      <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{item.message}</p>
                    )}
                    <p className="mt-1 text-[10px] text-slate-400">{timeAgo(item.createdAt)}</p>
                  </div>
                  {!item.read && (
                    <button
                      type="button"
                      onClick={() => void handleMarkOne(item.id)}
                      className="mt-0.5 shrink-0 opacity-0 transition group-hover:opacity-100"
                      aria-label="Đánh dấu đã đọc"
                    >
                      <CheckCircle2 size={15} className="text-slate-300 hover:text-blue-500" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
