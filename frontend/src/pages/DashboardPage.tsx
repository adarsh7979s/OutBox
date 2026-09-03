import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, Mail } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import StatCard from '../components/email/StatCard';
import EmailRow from '../components/email/EmailRow';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import { useScheduledEmails, useEmailCounts, useCancelEmail, useSearchEmails } from '../hooks/useEmails';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: counts } = useEmailCounts();
  const { data: scheduled, isLoading } = useScheduledEmails(page);
  const { data: searchResults } = useSearchEmails(searchQuery, 'SCHEDULED');
  const cancelMutation = useCancelEmail();

  const emails = searchQuery ? searchResults?.results : scheduled?.data;
  const totalPages = searchQuery ? 1 : (scheduled?.totalPages ?? 1);

  return (
    <>
      <TopBar
        title="Scheduled"
        showSearch
        onSearch={setSearchQuery}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatCard
          icon={Clock}
          label="Scheduled"
          value={counts?.scheduled ?? 0}
          color="cyan"
          delay={0}
        />
        <StatCard
          icon={CheckCircle2}
          label="Sent"
          value={counts?.sent ?? 0}
          color="green"
          delay={100}
        />
      </div>

      {/* Email list */}
      {isLoading ? (
        <Spinner />
      ) : !emails || emails.length === 0 ? (
        <EmptyState
          icon={<Mail className="w-7 h-7" />}
          title={searchQuery ? 'No results' : 'No scheduled emails'}
          description={searchQuery ? 'Try a different search term' : 'Schedule your first batch of emails to get started'}
          action={searchQuery ? undefined : { label: 'Compose', onClick: () => navigate('/compose') }}
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
          {!searchQuery && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </>
  );
}
