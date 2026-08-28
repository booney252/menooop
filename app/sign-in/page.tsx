import { SignInForm } from "./SignInForm";

export const dynamic = "force-dynamic";

export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; problem?: string }>;
}) {
  const { next, problem } = await searchParams;

  const problemLine =
    problem === "expired"
      ? "That link has expired — they only last an hour. Here’s a fresh one."
      : problem === "link"
        ? "That link didn’t come through properly. Try sending another."
        : null;

  return <SignInForm next={next ?? ""} problem={problemLine} />;
}
