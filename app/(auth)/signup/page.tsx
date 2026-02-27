import { AuthCard } from "@/components/molecules";
import { SignupForm } from "@/components/organisms";

export default function SignupPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Join AMS and start tracking attendance"
      footer={
        <span className="text-slate-600 text-xs font-mono">
          © 2025 AMS. Attendance Management System
        </span>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
