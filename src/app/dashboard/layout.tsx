import { auth } from "@/lib/auth";
import DashboardNav from "@/components/DashboardNav";
import TrialGate from "@/components/TrialGate";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-paper">
      <TrialGate>
        <DashboardNav businessName={session?.user?.name || "Your business"} />
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </TrialGate>
    </div>
  );
}