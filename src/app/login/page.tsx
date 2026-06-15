import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { login } from "@/app/auth/actions";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const error = firstParam(params, "error");
  const message = firstParam(params, "message");
  const next = firstParam(params, "next") ?? "/dashboard";

  return (
    <section className="page-section">
      <div className="section-inner auth-panel">
        <PageHeader
          eyebrow="Account"
          title="Log in"
          description="Access your PowerPicks dashboard, monthly fantasy points, and free-to-play prediction history."
        />
        <form className="panel auth-form" action={login}>
          <input type="hidden" name="next" value={next} />
          {message ? <p className="form-message success">{message}</p> : null}
          {error ? <p className="form-message error">{error}</p> : null}
          <label>
            Email
            <input type="email" name="email" placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <input type="password" name="password" placeholder="Password" required />
          </label>
          <button className="button-primary" type="submit">
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
