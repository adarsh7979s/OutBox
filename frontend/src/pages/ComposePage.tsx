import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import EmailChips from '../components/email/EmailChips';
import FileUpload from '../components/email/FileUpload';
import { useScheduleEmails } from '../hooks/useEmails';
import { useSenders, useCreateSender } from '../hooks/useSenders';
import type { Sender } from '../api/types';

export default function ComposePage() {
  const navigate = useNavigate();
  const { data: senders, isLoading: sendersLoading } = useSenders();
  const createSenderMutation = useCreateSender();
  const scheduleMutation = useScheduleEmails();

  // Form state
  const [selectedSenderId, setSelectedSenderId] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [delayBetween, setDelayBetween] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(50);

  // Auto-select first sender when loaded
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

  const isValid = selectedSenderId && recipients.length > 0 && subject && body && scheduledAt;

  // Get min datetime (now + 1 minute)
  const minDateTime = new Date(Date.now() + 60000).toISOString().slice(0, 16);

  return (
    <>
      <TopBar title="Compose" showSearch={false} />

      <GlassCard hover={false} glow="none" padding="lg" className="animate-fade-in">
        <div className="flex flex-col gap-6">

          {/* Sender */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Sender</label>
            <div className="flex gap-3">
              <select
                value={selectedSenderId}
                onChange={(e) => setSelectedSenderId(e.target.value)}
                className="
                  flex-1 bg-white/[0.04] border border-[var(--color-border)] rounded-xl
                  px-4 py-2.5 text-sm text-[var(--color-text-primary)]
                  focus:outline-none focus:border-[var(--color-border-focus)]
                  focus:ring-1 focus:ring-[var(--color-border-focus)]
                  transition-all duration-200
                  appearance-none cursor-pointer
                "
                disabled={sendersLoading}
              >
                {!senders || senders.length === 0 ? (
                  <option value="">No senders — create one →</option>
                ) : (
                  senders.map((s: Sender) => (
                    <option key={s.id} value={s.id}>
                      {s.name ? `${s.name} (${s.email})` : s.email}
                    </option>
                  ))
                )}
              </select>
              <Button
                variant="secondary"
                size="md"
                icon={<Plus className="w-4 h-4" />}
                onClick={handleCreateSender}
                loading={createSenderMutation.isPending}
              >
                New
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/5" />

          {/* Recipients */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Recipients</label>
            <EmailChips
              emails={recipients}
              onChange={setRecipients}
              placeholder="Type email and press Enter..."
            />
            <FileUpload onEmailsParsed={handleFileEmails} />
          </div>

          {/* Divider */}
          <div className="h-px bg-white/5" />

          {/* Subject */}
          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject line..."
          />

          {/* Body */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email content here..."
              rows={8}
              className="
                w-full bg-white/[0.04] border border-[var(--color-border)] rounded-xl
                px-4 py-3 text-sm text-[var(--color-text-primary)]
                placeholder:text-[var(--color-text-muted)]
                focus:outline-none focus:border-[var(--color-border-focus)]
                focus:ring-1 focus:ring-[var(--color-border-focus)]
                transition-all duration-200 resize-none
              "
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-white/5" />

          {/* Schedule Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Schedule for
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={minDateTime}
                className="
                  w-full bg-white/[0.04] border border-[var(--color-border)] rounded-xl
                  px-4 py-2.5 text-sm text-[var(--color-text-primary)]
                  focus:outline-none focus:border-[var(--color-border-focus)]
                  focus:ring-1 focus:ring-[var(--color-border-focus)]
                  transition-all duration-200
                  [color-scheme:dark]
                "
              />
            </div>

            <Input
              label="Delay between emails (sec)"
              type="number"
              value={delayBetween}
              onChange={(e) => setDelayBetween(Number(e.target.value))}
              min={0}
              max={60}
            />

            <Input
              label="Hourly limit per sender"
              type="number"
              value={hourlyLimit}
              onChange={(e) => setHourlyLimit(Number(e.target.value))}
              min={1}
              max={1000}
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-[var(--color-text-muted)]">
              {recipients.length > 0 && (
                <>
                  {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
                  {scheduledAt && (
                    <> · {new Date(scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</>
                  )}
                </>
              )}
            </p>
            <Button
              size="lg"
              onClick={handleSubmit}
              loading={scheduleMutation.isPending}
              disabled={!isValid}
            >
              Schedule {recipients.length > 0 ? `${recipients.length} Email${recipients.length !== 1 ? 's' : ''}` : 'Emails'}
            </Button>
          </div>
        </div>
      </GlassCard>
    </>
  );
}
