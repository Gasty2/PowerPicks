import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { signup } from "@/app/auth/actions";

type SignupPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = (await searchParams) ?? {};
  const error = firstParam(params, "error");

  return (
    <section className="page-section">
      <div className="section-inner auth-panel">
        <PageHeader
          eyebrow="Account"
          title="Sign up"
          description="Create a free PowerPicks account with 1,000 monthly fantasy points. Points have no cash value."
        />
        <form className="panel auth-form" action={signup}>
          {error ? <p className="form-message error">{error}</p> : null}
          <label>
            Display name
            <input type="text" name="displayName" placeholder="Alex Morgan" required />
          </label>
          <label>
            Email
            <input type="email" name="email" placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <input type="password" name="password" placeholder="Password" required minLength={8} />
          </label>
          <button className="button-primary" type="submit">
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
