export const metadata = { title: "Offline — Marlow" };

export default function Offline() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink px-9 text-center">
      <p className="display text-[32px] leading-tight text-bone">You&rsquo;re offline.</p>
      <p className="mt-6 max-w-[19rem] text-[17px] leading-[1.7] text-dune">
        Marlow needs a connection to save a check-in. Nothing is lost — come back when you have
        signal and it will be exactly where you left it.
      </p>
    </div>
  );
}
