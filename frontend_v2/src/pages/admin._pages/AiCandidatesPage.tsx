import AdminShell from '@/components/AdminShell';
import AiCandidatesPanel from '@/components/AiCandidatesPanel';
import { usePageTitle } from '@/lib/usePageTitle';

interface AiCandidatesPageProps {
  /** True when rendered inside the admin sidebar layout, which already
   * provides its own header/chrome — skip AdminShell in that case. */
  embedded?: boolean;
}

export default function AiCandidatesPage({ embedded }: AiCandidatesPageProps) {
  usePageTitle("Live Risk Intelligence");
  // Shared between Admin and Data Analyst — AdminShell's back arrow
  // defaults to /admin, which a Data Analyst can't access.
  const isAdmin = localStorage.getItem('userType') === 'admin';

  if (embedded) {
    return (
      <div className="space-y-6">
        <p className="text-brand-muted text-sm -mt-2">
          AI-classified news, reviewed by a person before it ever reaches the risk database.
        </p>
        <AiCandidatesPanel />
      </div>
    );
  }

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
