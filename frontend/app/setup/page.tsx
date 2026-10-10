"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type FormDataShape = {
  setup_token: string;
  owner_name: string;
  owner_email: string;
  owner_password: string;
  instance_name: string;
  domain: string;
};

const steps = ["Verify", "Owner", "Instance"];
const initial: FormDataShape = {
  setup_token: "",
  owner_name: "",
  owner_email: "",
  owner_password: "",
  instance_name: "My Peykbox",
  domain: "",
};

function errorText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(errorText).join(" ");
  if (value && typeof value === "object") {
    return Object.entries(value).map(([key, item]) => `${key}: ${errorText(item)}`).join(" | ");
  }
  return "Unexpected server response.";
}

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormDataShape>(initial);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/setup/status/", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("The backend is unavailable.");
        return response.json() as Promise<{ installed: boolean }>;
      })
      .then((result) => {
        if (result.installed) router.replace("/");
        else setReady(true);
      })
      .catch(() => setError("Cannot connect to Django. Check Docker services."));
  }, [router]);

  function update(field: keyof FormDataShape, value: string) {
    setData((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function finish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/setup/complete/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        setError(errorText(payload));
        return;
      }
      router.replace("/");
    } catch {
      setError("Network error. Check your connection to the backend.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="installation-container">
        <div className="brand"><span className="brand-icon">✉</span> Peykbox <span className="tag">SETUP</span></div>
        <section className="card">
          <div className="eyebrow">SELF-HOSTED EMAIL</div>
          <h1>Make this space yours.</h1>
          <p className="muted intro">A secure first-run setup for your open-source mail workspace.</p>
          <div className="stepper" aria-label="Setup steps">
            {steps.map((label, index) => (
              <div key={label} className={`step ${index === step ? "active" : ""} ${index < step ? "done" : ""}`}>
                <span className="step-bubble">{index < step ? "✓" : index + 1}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>

          {error && <div className="notice error" role="alert">{error}</div>}
          {!ready ? (
            <p className="muted">Checking setup availability…</p>
          ) : step === 0 ? (
            <form onSubmit={next}>
              <h2>Verify your installation</h2>
              <p className="muted">Copy your one-time setup key from the Docker container. It prevents strangers from claiming a new deployment.</p>
              <div className="code-box">docker compose exec backend cat /run/peykbox/setup_token</div>
              <label htmlFor="setup_token">Installation key</label>
              <input id="setup_token" type="password" autoComplete="off" required minLength={20} value={data.setup_token} onChange={(event) => update("setup_token", event.target.value)} placeholder="Paste your installation key" />
              <div className="actions"><button type="submit">Continue →</button></div>
            </form>
          ) : step === 1 ? (
            <form onSubmit={next}>
              <h2>Create the owner account</h2>
              <p className="muted">This is the primary account for configuring your instance. Use a strong, unique password.</p>
              <label htmlFor="owner_name">Display name</label>
              <input id="owner_name" required maxLength={100} value={data.owner_name} onChange={(event) => update("owner_name", event.target.value)} placeholder="Jane Doe" />
              <label htmlFor="owner_email">Email address</label>
              <input id="owner_email" required type="email" maxLength={150} value={data.owner_email} onChange={(event) => update("owner_email", event.target.value)} placeholder="jane@example.com" />
              <label htmlFor="owner_password">Password (12+ characters)</label>
              <input id="owner_password" required minLength={12} maxLength={128} type="password" autoComplete="new-password" value={data.owner_password} onChange={(event) => update("owner_password", event.target.value)} placeholder="Choose a strong password" />
              <div className="actions"><button type="button" className="secondary" onClick={() => setStep(0)}>← Back</button><button type="submit">Continue →</button></div>
            </form>
          ) : (
            <form onSubmit={finish}>
              <h2>Configure your instance</h2>
              <p className="muted">Choose its display name and optionally specify the mail domain. SMTP and IMAP connections will be configurable in a later milestone.</p>
              <label htmlFor="instance_name">Workspace name</label>
              <input id="instance_name" required maxLength={100} value={data.instance_name} onChange={(event) => update("instance_name", event.target.value)} placeholder="My Peykbox" />
              <label htmlFor="domain">Email domain (optional)</label>
              <input id="domain" maxLength={253} value={data.domain} onChange={(event) => update("domain", event.target.value)} placeholder="example.com" />
              <div className="notice">This milestone saves instance details and securely creates the owner. It does not send or receive email yet.</div>
              <div className="actions"><button type="button" className="secondary" disabled={submitting} onClick={() => setStep(1)}>← Back</button><button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Finish installation ✓"}</button></div>
            </form>
          )}
        </section>
        <p className="footer-note">Built with Django REST Framework, Next.js & Docker · Open Source</p>
      </div>
    </main>
  );
}
