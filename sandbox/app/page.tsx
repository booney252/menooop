import Link from "next/link";
import { listIdeas, thisWeek, whatsWorking } from "@/lib/queries";
import { STATUSES, type Status } from "@/lib/types";
import { QuickAdd } from "@/components/QuickAdd";
import { ExportButton } from "@/components/ExportButton";

export const dynamic = "force-dynamic";

const LABEL: Record<Status, string> = { idea: "Idea", scripted: "Scripted", filmed: "Filmed", posted: "Posted", killed: "Killed" };

export default function Dashboard() {
  const week = thisWeek();
  const working = whatsWorking(5);
  const byStatus = new Map(week.ideasByStatus.map((r) => [r.status, r.n]));
  const totalIdeas = new Map<string, number>();
  for (const i of listIdeas()) totalIdeas.set(i.status, (totalIdeas.get(i.status) ?? 0) + 1);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <QuickAdd />
          <ExportButton />
        </div>
      </div>

      <section>
        <div className="mb-2 text-[11px] uppercase tracking-wider text-mute">This week · since {week.since}</div>
        <div className="grid grid-cols-8 gap-3">
          {STATUSES.map((s) => (
            <Tile key={s} label={LABEL[s]} value={byStatus.get(s) ?? 0} sub={`${totalIdeas.get(s) ?? 0} total`} href="/ideas" />
          ))}
          <Tile label="Videos posted" value={week.posted} href="/videos" />
          <Tile label="Views" value={week.views} href="/videos" />
          <Tile label="Spots" value={week.spots} href="/videos" />
        </div>
      </section>

      <section>
        <div className="mb-2 text-[11px] uppercase tracking-wider text-mute">What&apos;s working · top 5 by founding spots per 1k views</div>
        {working.length === 0 ? (
          <div className="rounded-md border border-dashed border-line px-4 py-8 text-center text-mute">
            Nothing yet. Log a video with views and founding spots and this fills in.
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-line">
            <table className="w-full text-[13px]">
              <thead className="bg-panel text-left text-[11px] uppercase tracking-wider text-mute">
                <tr>
                  <th className="px-3 py-2 font-normal">Video</th>
                  <th className="px-3 py-2 font-normal">Hook</th>
                  <th className="px-3 py-2 font-normal">Format</th>
                  <th className="px-3 py-2 text-right font-normal">Views</th>
                  <th className="px-3 py-2 text-right font-normal">Spots</th>
                  <th className="px-3 py-2 text-right font-normal">Spots / 1k</th>
                </tr>
              </thead>
              <tbody>
                {working.map(({ video, idea, rate }) => (
                  <tr key={video.id} className="border-t border-line align-top">
                    <td className="px-3 py-2">
                      <Link href="/videos" className="font-medium hover:underline">{video.title || `#${video.id}`}</Link>
                      <div className="text-xs text-mute">{video.platform} · {video.posted_at}</div>
                    </td>
                    <td className="max-w-[420px] px-3 py-2 text-mute">
                      {idea ? (
                        <Link href={`/ideas/${idea.id}`} className="hover:text-fg">{idea.hook || <em>no hook written</em>}</Link>
                      ) : (
                        <em>not linked to an idea</em>
                      )}
                    </td>
                    <td className="px-3 py-2">{idea?.format ?? "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{(video.views ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{video.founding_spots ?? 0}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">{rate.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Tile({ label, value, sub, href }: { label: string; value: number; sub?: string; href: string }) {
  return (
    <Link href={href} className="rounded-md border border-line bg-panel px-3 py-2.5 hover:bg-panel2">
      <div className="text-[11px] uppercase tracking-wider text-mute">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value.toLocaleString()}</div>
      {sub ? <div className="text-[11px] text-mute">{sub}</div> : null}
    </Link>
  );
}
