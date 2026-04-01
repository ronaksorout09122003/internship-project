import Link from "next/link";
import { BrandMark } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-6 py-10">
      <section className="card-surface soft-appear w-full max-w-2xl rounded-[2rem] p-10 text-center">
        <div className="mb-8 flex justify-center">
          <BrandMark />
        </div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">
          Not Found
        </p>
        <h1 className="display-font text-4xl font-bold text-slate-950">
          That mentoring room does not exist anymore.
        </h1>
        <p className="mt-4 text-base text-slate-600">
          The session may have been removed, ended, or the link may be incomplete.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/dashboard">
            <Button>Back to dashboard</Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
