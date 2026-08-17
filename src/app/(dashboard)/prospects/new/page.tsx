import Link from "next/link";
import { createProspect } from "../actions";

const input =
  "rounded-lg border border-border bg-white px-3 py-2.5 text-sm";

async function handleCreateProspect(formData: FormData): Promise<void> {
  "use server";

  await createProspect(formData);
}

export default function NewProspectPage() {
  return (
    <>
      <header className="border-b border-border bg-background/80 px-6 py-5 backdrop-blur md:px-10">
        <Link
          href="/prospects"
          className="text-sm font-medium text-muted hover:text-zinc-900"
        >
          ← Prospects
        </Link>
      </header>

      <div className="px-6 py-8 md:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Acquisition
            </p>

            <h1 className="mt-1 font-display text-2xl font-semibold">
              Add prospect
            </h1>

            <p className="mt-1 text-sm text-muted">
              Create a prospect manually. Source and source URL remain attached
              to the record for lineage.
            </p>
          </div>

          <form action={handleCreateProspect} className="space-y-6">
            <section className="rounded-[14px] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
              <h2 className="font-semibold">Identity & company</h2>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <input
                  name="firstName"
                  placeholder="First name"
                  className={input}
                />
                <input
                  name="lastName"
                  placeholder="Last name"
                  className={input}
                />
                <input
                  name="fullName"
                  placeholder="Full name"
                  className={input}
                />
                <input
                  name="jobTitle"
                  placeholder="Job title"
                  className={input}
                />
                <input
                  name="companyName"
                  placeholder="Company"
                  className={input}
                />
                <input
                  name="industry"
                  placeholder="Industry"
                  className={input}
                />
              </div>
            </section>

            <section className="rounded-[14px] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
              <h2 className="font-semibold">Contact & location</h2>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  className={input}
                />
                <input
                  name="phone"
                  placeholder="Phone"
                  className={input}
                />
                <input
                  name="mobile"
                  placeholder="Mobile"
                  className={input}
                />
                <input
                  name="website"
                  placeholder="Website"
                  className={input}
                />
                <input
                  name="linkedinUrl"
                  placeholder="LinkedIn URL"
                  className={input}
                />
                <input
                  name="address"
                  placeholder="Address"
                  className={input}
                />
                <input
                  name="city"
                  placeholder="City"
                  className={input}
                />
                <input
                  name="state"
                  placeholder="State / Province"
                  className={input}
                />
                <input
                  name="postalCode"
                  placeholder="ZIP / Postal code"
                  className={input}
                />
                <input
                  name="country"
                  placeholder="Country"
                  className={input}
                />
              </div>
            </section>

            <section className="rounded-[14px] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
              <h2 className="font-semibold">Source & qualification</h2>

              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <select
                  name="source"
                  className={input}
                  defaultValue="Manual"
                >
                  <option>Manual</option>
                  <option>CSV Import</option>
                  <option>Excel Import</option>
                  <option>Scraper</option>
                  <option>API</option>
                  <option>Website</option>
                  <option>Referral</option>
                </select>

                <select
                  name="status"
                  className={input}
                  defaultValue="NEW"
                >
                  <option>NEW</option>
                  <option>CONTACTED</option>
                  <option>QUALIFIED</option>
                  <option>CONVERTED</option>
                  <option>ARCHIVED</option>
                </select>

                <input
                  name="score"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue="0"
                  placeholder="Score"
                  className={input}
                />

                <input
                  name="sourceUrl"
                  type="url"
                  placeholder="Source URL (optional)"
                  className={input}
                />
              </div>

              <textarea
                name="notes"
                placeholder="Notes / qualification context"
                className={`mt-4 min-h-28 w-full ${input}`}
              />
            </section>

            <div className="flex justify-end gap-3">
              <Link
                href="/prospects"
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg"
              >
                Create prospect
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}