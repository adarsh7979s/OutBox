import { useState } from 'react';
import { Send } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import EmailRow from '../components/email/EmailRow';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import { useSentEmails, useSearchEmails } from '../hooks/useEmails';

export default function SentPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: sent, isLoading } = useSentEmails(page);
  const { data: searchResults } = useSearchEmails(searchQuery, 'SENT');

  const emails = searchQuery ? searchResults?.results : sent?.data;
  const totalPages = searchQuery ? 1 : (sent?.totalPages ?? 1);

  return (
    <>
      <TopBar
        title="Sent"
        subtitle="Every email that has left the building, most recent first."
        showSearch
        onSearch={setSearchQuery}
      />

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-[var(--color-ink)]">
          {searchQuery ? 'Search results' : 'Delivered'}
        </h2>
        {emails && emails.length > 0 && (
          <span className="text-xs font-data text-[var(--color-ink-muted)]">{emails.length} shown</span>
        )}
      </div>

      {isLoading ? (
        <Spinner />
      ) : !emails || emails.length === 0 ? (
        <EmptyState
          icon={<Send className="w-7 h-7" />}
          title={searchQuery ? 'No matches' : 'No sent emails yet'}
          description={searchQuery ? 'Try a different name or subject line.' : 'Once your scheduled emails go out, they will land here.'}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 stagger-children">
            {emails.map((email) => (
              <EmailRow key={email.id} email={email} />
            ))}
          </div>
          {!searchQuery && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
        </>
      )}
    </>
  );
}
