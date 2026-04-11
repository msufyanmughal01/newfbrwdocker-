// T014 [US1]: Business Profile settings page
// Server Component — fetches profile, creates blank if missing, renders form

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getBusinessProfile, upsertBusinessProfile } from '@/lib/settings/business-profile';
import { BusinessProfileForm } from '@/components/settings/BusinessProfileForm';

export const metadata = {
  title: 'Business Profile | Easy Digital Invoice',
};

export default async function BusinessProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/sign-in');

  // Ensure a blank profile row exists for this user
  let profile = await getBusinessProfile(session.user.id);
  if (!profile) {
    await upsertBusinessProfile(session.user.id, {});
    profile = await getBusinessProfile(session.user.id);
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Business Profile</h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Your business details are automatically filled in on every new invoice.
        </p>
      </div>

      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6">
        <BusinessProfileForm profile={profile} />
      </div>
    </div>
  );
}
