import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export const metadata = { title: "Your data — Marlow" };

export default function Privacy() {
  return (
    <div className="min-h-dvh bg-ink px-7 py-16 sm:flex sm:justify-center">
      <article className="w-full max-w-[34rem]">
        <Wordmark />

        <h1 className="display mt-10 text-[31px] leading-[1.15] text-bone">
          Your data is yours.
        </h1>
        <p className="mt-6 text-[17px] leading-[1.7] text-[#dcd0d8]">
          What you write in Marlow is some of the most personal information there is. Here is
          exactly what happens to it, in plain words.
        </p>

        <Section title="What Marlow stores">
          Your email address, the symptoms you chose, your daily check-ins and any notes you write
          with them, the things you have told us you are trying, the reports you generate, and your
          conversations with Ask Marlow. Nothing else.
        </Section>

        <Section title="Who can see it">
          You. Your rows are locked to your account in the database itself, not just in the app
          code, so one account cannot read another&rsquo;s data even if something above the
          database goes wrong.
        </Section>

        <Section title="What we never do">
          We do not sell your data. We do not share it with advertisers, insurers, employers or
          data brokers. We do not use it to target you with anything. There is no third-party
          tracking in this app.
        </Section>

        <Section title="Ask Marlow and the AI">
          When you ask Marlow a question, your question and a short summary of your recent
          check-ins are sent to Anthropic&rsquo;s API to generate the reply. That is what makes the
          answer about you rather than generic. It is not used to train anyone&rsquo;s model.
        </Section>

        <Section title="What we measure">
          Counts, not content: that a check-in happened and how long it took, that a report was
          generated, that you came back. Never what you logged, never what you wrote.
        </Section>

        <Section title="Taking it with you, or deleting it">
          You can download everything as a JSON file at any time from Settings. You can also delete
          your account from Settings, and that is a real delete — your check-ins, notes,
          conversations and reports are removed from the database, not hidden with a flag. It
          cannot be undone, and we cannot get it back for you afterwards.
        </Section>

        <Section title="One more thing">
          Marlow is a place to keep a record. It is not a medical device, it does not diagnose, and
          it does not replace your doctor.
        </Section>

        <Link
          href="/settings"
          className="mt-12 inline-block py-2 text-[15px] text-dune underline underline-offset-4"
        >
          Back to settings
        </Link>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="display text-[21px] leading-snug text-bone">{title}</h2>
      <p className="mt-3 text-[16.5px] leading-[1.7] text-dune">{children}</p>
    </section>
  );
}
