import AdminShell from '@/components/AdminShell';
import AiCandidatesPanel from '@/components/AiCandidatesPanel';
import { usePageTitle } from '@/lib/usePageTitle';

export default function AiCandidatesPage() {
  usePageTitle("Live Risk Intelligence");
  // Shared between Admin and Data Analyst — AdminShell's back arrow
  // defaults to /admin, which a Data Analyst can't access.
  const isAdmin = localStorage.getItem('userType') === 'admin';

  return (
    <AdminShell
      title="Live Risk Intelligence"
      subtitle="AI-classified news, reviewed by a person before it ever reaches the risk database."
      backTo={isAdmin ? '/admin' : '/data-analyst'}
    >
      <AiCandidatesPanel />
    </AdminShell>
  );
}
