import Link from "next/link";
import { PageHeader } from "@/components/page-header";

export default function LoginPage() {
  return (
    <section className="page-section">
      <div className="section-inner auth-panel">
        <PageHeader
          eyebrow="Account"
          title="Log in"
          description="Access the placeholder dashboard with the same fantasy-points language used across PowerPicks."
        />
        <form className="panel auth-form">
          <label>
            Email
            <input type="email" placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input type="password" placeholder="Password" />
          </label>
          <button className="button-primary" type="button">
            Log in
          </button>
          <Link className="text-link" href="/signup">
            Need an account?
          </Link>
        </form>
      </div>
    </section>
  );
}
