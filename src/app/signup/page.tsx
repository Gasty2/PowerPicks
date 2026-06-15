import Link from "next/link";
import { PageHeader } from "@/components/page-header";

export default function SignupPage() {
  return (
    <section className="page-section">
      <div className="section-inner auth-panel">
        <PageHeader
          eyebrow="Account"
          title="Sign up"
          description="Create a placeholder profile for monthly fantasy points, prediction history, and credibility."
        />
        <form className="panel auth-form">
          <label>
            Display name
            <input type="text" placeholder="Alex Morgan" />
          </label>
          <label>
            Email
            <input type="email" placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input type="password" placeholder="Password" />
          </label>
          <button className="button-primary" type="button">
            Create account
          </button>
          <Link className="text-link" href="/login">
            Already have an account?
          </Link>
        </form>
      </div>
    </section>
  );
}
