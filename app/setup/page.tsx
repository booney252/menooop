/** Shown when the app is running without Supabase keys. Developer-facing. */
export default function Setup() {
  return (
    <div className="min-h-dvh bg-ink px-7 py-20">
      <div className="mx-auto max-w-[30rem]">
        <p className="display text-[19px] text-bone">Marlow</p>
        <h1 className="display mt-8 text-[31px] leading-[1.15] text-bone">
          Not connected yet.
        </h1>
        <p className="mt-5 text-[16.5px] leading-[1.7] text-dune">
          Marlow needs a Supabase project before it can hold anyone&rsquo;s data. Copy{" "}
          <code className="text-bone">.env.example</code> to{" "}
          <code className="text-bone">.env.local</code>, fill in the two Supabase values, and
          restart.
        </p>
        <pre className="mt-7 overflow-x-auto rounded-[16px] border hair bg-clay px-5 py-4 text-[13.5px] leading-relaxed text-[#e4d9e0]">
{`NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=`}
        </pre>
        <p className="mt-6 text-[15px] leading-relaxed text-dune">
          Then apply <code className="text-bone">supabase/migrations</code> to the project. The
          README has the whole sequence.
        </p>
      </div>
    </div>
  );
}
