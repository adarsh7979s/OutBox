/* ────────────────────────────────────────────────────────────
   THROWAWAY design-preview harness (not part of the app).
   Renders the authenticated pages with mock data + a mock auth
   session so the redesign can be screenshotted without the
   Docker/OAuth backend. Delete preview.html + preview.tsx when done.
   ──────────────────────────────────────────────────────────── */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import './index.css';

import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import SentPage from './pages/SentPage';
import ComposePage from './pages/ComposePage';
import LoginPage from './pages/LoginPage';
import type { EmailListItem, EmailStatus } from './api/types';

const now = Date.now();
const iso = (ms: number) => new Date(now + ms).toISOString();

const subjects = [
  'Your March product update is here',
  'Re: Q2 partnership proposal',
  'You left something in your cart',
  'Invitation: Customer advisory call',
  'Weekly digest — 7 new insights',
  'Action needed: confirm your email',
  'Early access to the new dashboard',
  'Thanks for signing up 🎉',
];
const people = [
  'jordan@northwind.co', 'mia.chen@acmecorp.com', 'devs@hooli.io', 'priya@lumen.app',
  'sam.okoro@brightlabs.com', 'contact@studioform.de', 'l.martinez@vertex.io', 'team@papertrail.co',
];

function makeEmail(i: number, status: EmailStatus, offsetMs: number): EmailListItem {
  return {
    id: `e${i}`,
    recipientEmail: people[i % people.length],
    subject: subjects[i % subjects.length],
    body: 'Hi there — just following up on the below. Let me know your thoughts!',
    status,
    scheduledAt: iso(offsetMs),
    sentAt: status === 'SENT' ? iso(offsetMs) : null,
    senderEmail: 'campaigns@reachinbox.io',
    senderName: 'ReachInbox',
    batchId: 'batch-1',
  };
}

const scheduledEmails: EmailListItem[] = [
  makeEmail(0, 'SCHEDULED', 2 * 3600_000 + 13 * 60_000),
  makeEmail(1, 'SCHEDULED', 5 * 3600_000),
  makeEmail(2, 'RATE_LIMITED', 6 * 3600_000),
  makeEmail(3, 'SCHEDULED', 26 * 3600_000),
  makeEmail(4, 'SCHEDULED', 50 * 3600_000),
  makeEmail(5, 'PROCESSING', 60_000),
];

const sentEmails: EmailListItem[] = [
  makeEmail(6, 'SENT', -20 * 60_000),
  makeEmail(7, 'SENT', -3 * 3600_000),
  makeEmail(0, 'SENT', -26 * 3600_000),
  makeEmail(2, 'FAILED', -28 * 3600_000),
  makeEmail(4, 'SENT', -50 * 3600_000),
];

const qc = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false, refetchInterval: false, staleTime: Infinity } },
});

localStorage.setItem('outbox_token', 'preview-token');
qc.setQueryData(['auth', 'me'], {
  id: 'u1', email: 'alex@reachinbox.io', name: 'Alex Rivera', avatarUrl: null,
  slackConnected: true, slackTeamName: 'ReachInbox', createdAt: iso(0),
});
qc.setQueryData(['emails', 'counts'], { scheduled: 128, sent: 3472 });
qc.setQueryData(['emails', 'scheduled', 1], { data: scheduledEmails, total: 128, page: 1, limit: 20, totalPages: 7 });
qc.setQueryData(['emails', 'sent', 1], { data: sentEmails, total: 3472, page: 1, limit: 20, totalPages: 40 });
qc.setQueryData(['senders'], [
  { id: 's1', email: 'campaigns@reachinbox.io', name: 'ReachInbox Campaigns', maxEmailsPerHour: 50, createdAt: iso(0) },
  { id: 's2', email: 'hello@reachinbox.io', name: 'ReachInbox Hello', maxEmailsPerHour: 100, createdAt: iso(0) },
]);

// AuthProvider reads localStorage token + the seeded ['auth','me'] cache.
import { AuthProvider } from './hooks/useAuth';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/sent" element={<SentPage />} />
              <Route path="/compose" element={<ComposePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster position="bottom-right" />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  </StrictMode>,
);

// Silence unused import in some TS configs
void Outlet;
