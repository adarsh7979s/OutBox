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
        showSearch
        onSearch={setSearchQuery}
      />

      {isLoading ? (
        <Spinner />
      ) : !emails || emails.length === 0 ? (
        <EmptyState
          icon={<Send className="w-7 h-7" />}
          title={searchQuery ? 'No results' : 'No sent emails yet'}
          description={searchQuery ? 'Try a different search term' : 'Emails will appear here after they are delivered'}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 stagger-children">
            {emails.map((email) => (
              <EmailRow
                key={email.id}
                email={email}
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
