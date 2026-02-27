import { AuthCard } from "@/components/molecules";
import { LoginForm } from "@/components/organisms";

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your AMS account"
      footer={
        <span className="text-slate-600 text-xs font-mono">
          © 2025 AMS. Attendance Management System
        </span>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
