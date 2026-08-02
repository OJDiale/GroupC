import AdminShell from '@/components/AdminShell';
import AiCandidatesPanel from '@/components/AiCandidatesPanel';

export default function AiCandidatesPage() {
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
