import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Mail, Plus, ArrowUpRight } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import StatCard from '../components/email/StatCard';
import EmailRow from '../components/email/EmailRow';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import { useAuth } from '../hooks/useAuth';
import { useScheduledEmails, useEmailCounts, useCancelEmail, useSearchEmails } from '../hooks/useEmails';
import type { EmailListItem } from '../api/types';

/** Live-ticking countdown to a future ISO timestamp. */
function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, new Date(target).getTime() - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <span className="font-data tabular-nums">
      {h > 0 && `${h}h `}{pad(m)}m {pad(s)}s
    </span>
  );
}

function getFirstName(name?: string) {
  return name?.trim().split(/\s+/)[0] ?? 'there';
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: counts } = useEmailCounts();
  const { data: scheduled, isLoading } = useScheduledEmails(page);
  const { data: searchResults } = useSearchEmails(searchQuery, 'SCHEDULED');
  const cancelMutation = useCancelEmail();

  const emails = searchQuery ? searchResults?.results : scheduled?.data;
  const totalPages = searchQuery ? 1 : (scheduled?.totalPages ?? 1);

  // Next upcoming send — the scheduler's headline fact.
  const nextSend: EmailListItem | undefined = (scheduled?.data ?? [])
    .filter((e) => e.status === 'SCHEDULED' && new Date(e.scheduledAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  return (
    <>
      <TopBar
        title="Scheduled"
        subtitle={`Good to see you, ${getFirstName(user?.name)}. Here's what's queued to go out.`}
        showSearch
        onSearch={setSearchQuery}
        right={
          <Button icon={<Plus strokeWidth={2.5} />} onClick={() => navigate('/compose')}>
            Compose
          </Button>
        }
      />

      {/* ── Next-send spotlight ── */}
      {!searchQuery && nextSend && (
        <div className="card relative overflow-hidden p-6 sm:p-7 mb-5 animate-fade-in-scale">
          {/* soft lime glow corner */}
          <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-[var(--color-lime-soft)] blur-2xl opacity-70 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
            <div className="min-w-0">
              <span className="pill bg-[var(--color-lime-soft)] text-[var(--color-lime-ink)] px-3 py-1 text-xs font-semibold gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-lime-deep)] animate-[pulse-soft_1.4s_ease-in-out_infinite]" />
                Next send
              </span>
              <p className="font-display text-3xl sm:text-4xl font-bold text-[var(--color-ink)] mt-3 leading-none">
                <Countdown target={nextSend.scheduledAt} />
              </p>
              <p className="text-sm text-[var(--color-ink-soft)] mt-3 truncate">
                To <span className="font-semibold text-[var(--color-ink)]">{nextSend.recipientEmail}</span> · {nextSend.subject}
              </p>
            </div>
            <button
              onClick={() => navigate('/compose')}
              className="btn-lime self-start sm:self-auto flex items-center gap-3 h-13 pl-3 pr-6 rounded-full font-semibold flex-shrink-0"
            >
              <span className="w-9 h-9 rounded-full bg-[var(--color-ink)] flex items-center justify-center">
                <ArrowUpRight className="w-[18px] h-[18px] text-[var(--color-lime)]" strokeWidth={2.5} />
              </span>
              Schedule more
            </button>
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatCard icon={CalendarClock} label="In the queue" value={counts?.scheduled ?? 0} color="violet" delay={0} hint="Waiting to be sent" />
        <StatCard icon={CheckCircle2} label="Delivered" value={counts?.sent ?? 0} color="green" delay={100} hint="Sent successfully" />
      </div>

      {/* ── List ── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-[var(--color-ink)]">
          {searchQuery ? 'Search results' : 'Upcoming'}
        </h2>
        {emails && emails.length > 0 && (
          <span className="text-xs font-data text-[var(--color-ink-muted)]">{emails.length} shown</span>
        )}
      </div>

      {isLoading ? (
        <Spinner />
      ) : !emails || emails.length === 0 ? (
        <EmptyState
          icon={<Mail className="w-7 h-7" />}
          title={searchQuery ? 'No matches' : 'Nothing scheduled yet'}
          description={searchQuery ? 'Try a different name or subject line.' : 'Queue your first batch and it will show up here, counting down to send.'}
          action={searchQuery ? undefined : { label: 'Compose your first batch', onClick: () => navigate('/compose') }}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 stagger-children">
            {emails.map((email) => (
              <EmailRow
                key={email.id}
                email={email}
                showCancel
                onCancel={(id) => cancelMutation.mutate(id)}
              />
            ))}
          </div>
          {!searchQuery && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
        </>
      )}
    </>
  );
}
