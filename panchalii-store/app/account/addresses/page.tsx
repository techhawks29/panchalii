'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiDelete, apiPatch } from '../../../lib/api';
import { addressLines, useAddresses, type Address } from '../../../lib/account';
import { useAuthStore } from '../../../lib/stores/auth.store';
import { errorMessage } from '../../../lib/format';
import AddressDialog from '../../../components/AddressDialog';
import { EmptyState, PageHeader, icons } from '../../../components/ui';

export default function AddressesPage() {
  const qc = useQueryClient();
  const userName = useAuthStore((s) => s.user?.name);
  const { data: addresses, isLoading, isError, refetch } = useAddresses();
  const [dialog, setDialog] = useState<{ open: boolean; existing?: Address | null }>({ open: false });
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const run = async (a: Address, call: () => Promise<unknown>, done: string) => {
    setBusy(a._id);
    try {
      await call();
      await qc.invalidateQueries({ queryKey: ['addresses'] });
      toast.success(done);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
      setConfirming(null);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Delivery" title="Your Addresses" subtitle="Your default address is selected first at checkout.">
        {!!addresses?.length && <button onClick={() => setDialog({ open: true })} className="btn-primary">+ Add address</button>}
      </PageHeader>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-5">{[0, 1].map((i) => <div key={i} className="skeleton h-52" />)}</div>
      ) : isError ? (
        <EmptyState icon={icons.pin} title="Couldn't load addresses" body="Check your connection and try again." action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : !addresses?.length ? (
        <EmptyState icon={icons.pin} title="No saved addresses" body="Add an address now and checkout will fill it in for you." action={{ label: 'Add an address →', onClick: () => setDialog({ open: true }) }} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {addresses.map((a) => (
            <article key={a._id} className={`flex flex-col border transition-opacity ${busy === a._id ? 'opacity-50' : ''} ${a.isDefault ? 'border-gold/70 bg-gold/[0.05]' : 'border-[rgba(201,169,110,0.2)] bg-[#0F1A0F]'}`}>
              <div className="p-6 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">{a.label || 'Home'}</span>
                  {a.isDefault && <span className="bg-gold text-[#0F1A0F] text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-0.5">Default</span>}
                </div>
                <p className="font-display text-cream text-2xl mt-3">{a.name}</p>
                {addressLines(a).map((l) => <p key={l} className="text-sm text-cream-muted leading-relaxed">{l}</p>)}
                <p className="text-sm text-cream-muted/80 mt-1">+91 {a.phone}</p>
              </div>
              {confirming === a._id ? (
                <div className="flex items-center gap-3 px-6 py-3 border-t border-[rgba(201,169,110,0.2)]">
                  <span className="flex-1 text-xs text-cream-muted">{a.isDefault ? 'Remove? Another address will become the default.' : 'Remove this address?'}</span>
                  <button onClick={() => setConfirming(null)} className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cream-muted hover:text-cream">Keep</button>
                  <button onClick={() => run(a, () => apiDelete(`/me/addresses/${a._id}`), 'Address removed')} className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E5797D]">Remove</button>
                </div>
              ) : (
                <div className="grid grid-flow-col auto-cols-fr border-t border-[rgba(201,169,110,0.2)] divide-x divide-[rgba(201,169,110,0.2)]">
                  <button disabled={!!busy} onClick={() => setDialog({ open: true, existing: a })} className="py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold hover:bg-white/[0.03]">Edit</button>
                  {!a.isDefault && (
                    <button disabled={!!busy} onClick={() => run(a, () => apiPatch(`/me/addresses/${a._id}`, { isDefault: true }), 'Default address updated')} className="py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold hover:bg-white/[0.03]">
                      Set default
                    </button>
                  )}
                  <button disabled={!!busy} onClick={() => setConfirming(a._id)} className="py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E5797D] hover:bg-white/[0.03]">Remove</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <AddressDialog open={dialog.open} existing={dialog.existing} defaultName={userName} onClose={() => setDialog({ open: false })} />
    </div>
  );
}
