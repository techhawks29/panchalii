'use client';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '../../../lib/api';
import { useAuthStore } from '../../../lib/stores/auth.store';
import { dateTimeLabel } from '../../../lib/format';
import { EmptyState, PageHeader, icons } from '../../../components/ui';

interface Notice { _id: string; title: string; body: string; type: string; isRead: boolean; link?: string; createdAt: string }

function groupOf(iso: string) {
  const d = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const day = 86400000;
  if (d >= today) return 'Today';
  if (d.getTime() >= today.getTime() - day) return 'Yesterday';
  if (d.getTime() >= today.getTime() - 7 * day) return 'This week';
  return 'Earlier';
}

const TYPE_ICON: Record<string, string> = { order: '◇', promotion: '✦', review: '★', wallet: '₹' };

export default function NotificationsPage() {
  const qc = useQueryClient();
  const signedIn = useAuthStore((s) => s.isAuthenticated);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiGet<{ data: Notice[]; unreadCount: number }>('/me/notifications'),
    enabled: signedIn,
  });
  const items = data?.data ?? [];
  const unread = items.filter((n) => !n.isRead).length;

  const markRead = (n: Notice) => {
    if (n.isRead) return;
    qc.setQueryData<{ data: Notice[]; unreadCount: number }>(['notifications'], (old) => old && { ...old, data: old.data.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)) });
    apiPatch(`/me/notifications/${n._id}/read`).catch(() => undefined);
  };

  const markAll = async () => {
    qc.setQueryData<{ data: Notice[]; unreadCount: number }>(['notifications'], (old) => old && { ...old, data: old.data.map((x) => ({ ...x, isRead: true })), unreadCount: 0 });
    await apiPatch('/me/notifications/read-all').catch(() => refetch());
  };

  const groups = items.reduce<Record<string, Notice[]>>((acc, n) => ((acc[groupOf(n.createdAt)] ||= []).push(n), acc), {});

  return (
    <div>
      <PageHeader eyebrow="Updates" title="Notifications" subtitle={unread ? `${unread} unread` : items.length ? "You're all caught up" : undefined}>
        {unread > 0 && <button onClick={markAll} className="btn-ghost text-gold">Mark all read</button>}
      </PageHeader>

      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-24" />)}</div>
      ) : isError ? (
        <EmptyState icon={icons.bell} title="Couldn't load notifications" body="Check your connection and try again." action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : !items.length ? (
        <EmptyState icon={icons.bell} title="You're all caught up" body="Order updates, offers and new collections will appear here." action={{ label: 'Explore collections →', href: '/shop' }} />
      ) : (
        <div className="space-y-10">
          {Object.entries(groups).map(([group, list]) => (
            <section key={group}>
              <h2 className="label-eyebrow mb-3">{group}</h2>
              <div className="border-t border-[rgba(201,169,110,0.15)]">
                {list.map((n) => {
                  const inner = (
                    <div className={`flex gap-4 py-5 px-4 border-b border-[rgba(201,169,110,0.15)] transition-colors ${n.isRead ? '' : 'bg-gold/[0.05]'} ${n.link ? 'hover:bg-white/[0.03]' : ''}`}>
                      <span className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 text-gold ${n.isRead ? 'border-gold/25 opacity-60' : 'border-gold/60'}`}>{TYPE_ICON[n.type] ?? '◦'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <p className={`font-display text-cream text-lg flex-1 ${n.isRead ? '' : 'font-semibold'}`}>{n.title}</p>
                          {!n.isRead && <span className="mt-2 w-1.5 h-1.5 rotate-45 bg-gold shrink-0" aria-label="Unread" />}
                        </div>
                        <p className={`text-sm leading-relaxed mt-1 ${n.isRead ? 'text-cream-muted/75' : 'text-cream-muted'}`}>{n.body}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-cream-muted/60">{dateTimeLabel(n.createdAt)}</span>
                          {n.link && <span className="text-[10px] uppercase tracking-[0.2em] text-gold">View →</span>}
                        </div>
                      </div>
                    </div>
                  );
                  return n.link?.startsWith('/') ? (
                    <Link key={n._id} href={n.link} onClick={() => markRead(n)} className="block">{inner}</Link>
                  ) : (
                    <button key={n._id} onClick={() => markRead(n)} className="block w-full text-left">{inner}</button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
