import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, ChevronDown, Users, Gauge, Timer, ArrowUpRight } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import EmailChips from '../components/email/EmailChips';
import FileUpload from '../components/email/FileUpload';
import { useScheduleEmails } from '../hooks/useEmails';
import { useSenders, useCreateSender } from '../hooks/useSenders';
import type { Sender } from '../api/types';

function SectionLabel({ step, title, hint }: { step: number; title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="w-6 h-6 rounded-full bg-[var(--color-ink)] text-white text-xs font-bold font-data flex items-center justify-center flex-shrink-0">
        {step}
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-[var(--color-ink)] leading-tight">{title}</h3>
        {hint && <p className="text-xs text-[var(--color-ink-muted)]">{hint}</p>}
      </div>
    </div>
  );
}

export default function ComposePage() {
  const navigate = useNavigate();
  const { data: senders, isLoading: sendersLoading } = useSenders();
  const createSenderMutation = useCreateSender();
  const scheduleMutation = useScheduleEmails();

  const [selectedSenderId, setSelectedSenderId] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [delayBetween, setDelayBetween] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(50);

  if (senders && senders.length > 0 && !selectedSenderId) {
    setSelectedSenderId(senders[0].id);
  }

  const handleCreateSender = async () => {
    const sender = await createSenderMutation.mutateAsync({});
    setSelectedSenderId(sender.id);
  };

  const handleFileEmails = (emails: string[]) => {
    setRecipients((prev) => [...new Set([...prev, ...emails])]);
  };

  const handleSubmit = async () => {
    if (!selectedSenderId || recipients.length === 0 || !subject || !body || !scheduledAt) return;

    await scheduleMutation.mutateAsync({
      senderId: selectedSenderId,
      recipients,
      subject,
      body,
      scheduledAt: new Date(scheduledAt).toISOString(),
      delayBetweenEmails: delayBetween,
      hourlyLimit,
    });

    navigate('/dashboard');
  };

  const isValid = !!(selectedSenderId && recipients.length > 0 && subject && body && scheduledAt);
  const minDateTime = new Date(Date.now() + 60000).toISOString().slice(0, 16);

  return (
    <>
      <TopBar
        title="Compose"
        subtitle="Write once, schedule to many. OutBox paces the sending for you."
        showSearch={false}
      />

      <div className="grid lg:grid-cols-3 gap-5 items-start">
        {/* ── Form ── */}
        <GlassCard hover={false} padding="lg" className="lg:col-span-2 animate-fade-in">
          <div className="flex flex-col gap-8">
            {/* Sender */}
            <div>
              <SectionLabel step={1} title="From" hint="Which mailbox these go out from" />
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 min-w-0">
                  <select
                    value={selectedSenderId}
                    onChange={(e) => setSelectedSenderId(e.target.value)}
                    className="field w-full pl-4 pr-10 py-3 text-sm appearance-none cursor-pointer"
                    disabled={sendersLoading}
                  >
                    {!senders || senders.length === 0 ? (
                      <option value="">No senders yet — add one →</option>
                    ) : (
                      senders.map((s: Sender) => (
                        <option key={s.id} value={s.id}>
                          {s.name ? `${s.name} (${s.email})` : s.email}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[var(--color-ink-muted)] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <Button
                  variant="secondary"
                  size="md"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={handleCreateSender}
                  loading={createSenderMutation.isPending}
                >
                  New sender
                </Button>
              </div>
            </div>

            {/* Recipients */}
            <div>
              <SectionLabel step={2} title="Recipients" hint="Type, paste a list, or drop a file" />
              <div className="flex flex-col gap-3">
                <EmailChips
                  emails={recipients}
                  onChange={setRecipients}
                  placeholder="name@company.com"
                />
                <FileUpload onEmailsParsed={handleFileEmails} />
              </div>
            </div>

            {/* Message */}
            <div>
              <SectionLabel step={3} title="Message" hint="The subject and body everyone receives" />
              <div className="flex flex-col gap-4">
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject line…"
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your email…"
                  rows={9}
                  className="field w-full px-4 py-3 text-sm resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* ── Delivery summary (sticky) ── */}
        <div className="lg:sticky lg:top-10 animate-fade-in-scale" style={{ animationDelay: '0.08s' }}>
          <GlassCard hover={false} padding="lg">
            <h3 className="font-display text-lg font-semibold text-[var(--color-ink)] mb-5">Delivery</h3>

            <div className="flex flex-col gap-4">
              {/* Schedule time */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[var(--color-ink-soft)] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Send at
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={minDateTime}
                  className="field w-full px-4 py-3 text-sm [color-scheme:light]"
                />
              </div>

              {/* Pace controls */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-[var(--color-ink-soft)] flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5" /> Gap (sec)
                  </label>
                  <input
                    type="number"
                    value={delayBetween}
                    onChange={(e) => setDelayBetween(Number(e.target.value))}
                    min={0}
                    max={60}
                    className="field w-full px-3.5 py-2.5 text-sm font-data"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-[var(--color-ink-soft)] flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5" /> Per hour
                  </label>
                  <input
                    type="number"
                    value={hourlyLimit}
                    onChange={(e) => setHourlyLimit(Number(e.target.value))}
                    min={1}
                    max={1000}
                    className="field w-full px-3.5 py-2.5 text-sm font-data"
                  />
                </div>
              </div>

              <div className="h-px bg-[var(--color-border)] my-1" />

              {/* Review */}
              <div className="flex flex-col gap-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-ink-soft)] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[var(--color-violet)]" /> Recipients
                  </span>
                  <span className="font-data font-semibold text-[var(--color-ink)]">{recipients.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-ink-soft)] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--color-violet)]" /> When
                  </span>
                  <span className="font-data font-semibold text-[var(--color-ink)] text-right">
                    {scheduledAt
                      ? new Date(scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
                      : '—'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!isValid || scheduleMutation.isPending}
                className="btn-lime w-full flex items-center justify-center gap-3 h-13 rounded-full font-semibold mt-2 disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <span className="w-8 h-8 rounded-full bg-[var(--color-ink)] flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 text-[var(--color-lime)]" strokeWidth={2.5} />
                </span>
                {scheduleMutation.isPending
                  ? 'Scheduling…'
                  : `Schedule ${recipients.length > 0 ? recipients.length : ''} ${recipients.length === 1 ? 'email' : 'emails'}`.trim()}
              </button>
              {!isValid && (
                <p className="text-xs text-[var(--color-ink-muted)] text-center">
                  Add a sender, recipients, subject, body, and a send time.
                </p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
