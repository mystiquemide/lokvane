import Image from "next/image";
import { ArrowUpRight, BookOpen, Gavel, Repeat, ScanSearch } from "lucide-react";
import { Nav, Footer, REPO_URL } from "@/components/Nav";
import { PrimaryLink, SecondaryLink } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { RoundsChart } from "@/components/RoundsChart";
import rounds from "@/proof/rounds-de.json";
import playbook from "@/proof/playbook-de.json";
import run from "@/proof/round-6-ring-fix.json";
import hero from "@/public/images/hero-pottery.jpg";
import glassware from "@/public/images/glassware.jpg";
import candles from "@/public/images/candles-hand.jpg";
import shelf from "@/public/images/candle-shelf.jpg";

const STEPS = [
  { icon: ScanSearch, title: "Find every error.", body: "SERV Reasoning reads the English listing and Etsy's German version, and names each phrase that would mislead or put off a German buyer." },
  { icon: Gavel, title: "Get an independent verdict.", body: "A Reppo evaluator panel scores Etsy's version and the Lokvane fix side by side. Lokvane never grades its own work." },
  { icon: BookOpen, title: "Learn the market.", body: "The panel's critiques become rules in the Germany playbook. Each rule keeps the Reppo eval ID that taught it." },
  { icon: Repeat, title: "Fix the next one better.", body: "Every new listing is fixed with the full playbook, so one listing's lessons improve the next." },
];

const EXAMPLES = [
  { en: "19-piece set", de: "Set aus dem 19. Jahrhundert", reads: "a set from the 19th century" },
  { en: "Gift for her", de: "Gift für sie", reads: "poison for her" },
  { en: "no chips", de: "keine Chips", reads: "no potato chips" },
];

function SectionHead({ strong, rest, id }: { strong: string; rest: string; id?: string }) {
  return (
    <h2 id={id} className="max-w-3xl scroll-mt-28 text-[22px] font-medium leading-snug tracking-[-0.01em] sm:text-[26px]">
      <span className="text-text">{strong}</span> <span className="text-faint">{rest}</span>
    </h2>
  );
}

export default function Landing() {
  const r1 = rounds[0], r2 = rounds[1], r5 = rounds[4], r6 = rounds[5];
  const sampleRule = playbook.find((r) => r.sourceEvalId === "cmwi5qb4z000008kxpz3yh7zg") ?? playbook[0];
  return (
    <>
      <Nav />
      <main>
        {/* Hero */}
        <section className="relative -mt-[72px]">
          <div className="relative h-[780px] overflow-hidden sm:h-[800px]">
            <Image src={hero} alt="Hands shaping clay on a pottery wheel" fill priority placeholder="blur" sizes="100vw" className="object-cover object-[60%_45%]" />
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative mx-auto flex h-full max-w-[1200px] flex-col items-center justify-center px-6 pb-24 pt-16 text-center sm:pb-36">
              <Reveal>
                <p className="font-mono text-sm text-text/70">For Etsy sellers shipping to Germany</p>
              </Reveal>
              <Reveal delay={0.05}>
                <h1 className="mx-auto mt-5 max-w-3xl text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[64px]">
                  Etsy translated your listing. Here&apos;s what German buyers read.
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-text/80">
                  Lokvane finds the mistakes in Etsy&apos;s auto-translation, fixes the listing, and learns the German market from independent
                  evaluator verdicts.
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <div className="mt-9 flex flex-wrap justify-center gap-3">
                  <PrimaryLink href="/check">Check a listing</PrimaryLink>
                  <SecondaryLink href="/#results">See the results</SecondaryLink>
                </div>
              </Reveal>
            </div>
          </div>

          {/* App window with a recorded run */}
          <div className="relative mx-auto -mt-28 max-w-[1120px] px-4 sm:-mt-36 sm:px-6">
            <Reveal delay={0.2}>
              <div className="overflow-hidden rounded-2xl border border-line-2 bg-panel shadow-[0_40px_80px_-20px_rgba(0,0,0,0.75)]">
                <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-medium">lokvane</span>
                    <span className="text-faint">Germany</span>
                  </div>
                  <span className="rounded-md border border-line bg-panel-2 px-2 py-1 font-mono text-[11px] text-muted">Recorded run, round {run.round}. Explanations shortened</span>
                </div>
                <div className="grid md:grid-cols-[0.85fr_1.15fr]">
                  <div className="space-y-5 border-b border-line p-5 md:border-b-0 md:border-r">
                    <div>
                      <p className="font-mono text-xs text-faint">English listing</p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{run.original}</p>
                    </div>
                    <div>
                      <p className="font-mono text-xs text-faint">Etsy auto-translation</p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{run.machine}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line">
                      <div className="bg-panel-2 p-4">
                        <p className="font-mono text-xs text-faint">Etsy</p>
                        <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-muted">{run.baselineScore}</p>
                      </div>
                      <div className="bg-panel-2 p-4">
                        <p className="font-mono text-xs text-faint">Lokvane</p>
                        <p className="mt-1 flex items-baseline gap-2 font-mono text-3xl font-semibold tabular-nums">
                          {run.fixScore}
                          <span className="rounded bg-ok-soft px-1.5 py-0.5 text-xs font-medium text-ok">+{run.fixScore - run.baselineScore}</span>
                        </p>
                      </div>
                    </div>
                    <p className="font-mono text-[11px] leading-relaxed text-faint">Reppo scores out of 100 · eval {run.fixEvalId}</p>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">What the translation got wrong</p>
                      <span className="rounded-md bg-err-soft px-2 py-0.5 font-mono text-[11px] text-err">{run.errors.length} errors</span>
                    </div>
                    <ul className="mt-4 divide-y divide-line">
                      {run.errors.map((e) => (
                        <li key={e.machine} className="py-3 first:pt-0 last:pb-0">
                          <p className="text-[15px] leading-snug">
                            <span className="text-err line-through decoration-err/50">{e.machine}</span>
                            <span className="mx-2 text-faint">→</span>
                            <span className="text-ok">{e.fix}</span>
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-faint">{e.problem}</p>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 border-t border-line pt-3 font-mono text-[11px] text-faint">
                      {run.rulesUsed} playbook rules applied · SERV Reasoning · {run.model}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Problem */}
        <section className="mx-auto mt-32 grid max-w-[1200px] items-center gap-12 px-6 md:grid-cols-2">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line">
              <Image src={glassware} alt="Crystal glassware on a set table" fill placeholder="blur" sizes="(min-width: 768px) 560px, 100vw" className="object-cover" />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <SectionHead strong="Every listing is translated. Nobody checks it." rest="Etsy machine-translates each listing into the buyer's language, and most sellers can't read the result." />
            <p className="mt-5 text-[16px] leading-relaxed text-muted">
              Sellers report sets that changed era, product names turned into unrelated words, and English titles replaced outright. Etsy
              itself says hand-made translations read better and rank better in local search.
            </p>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {EXAMPLES.map((x) => (
                <li key={x.en} className="grid grid-cols-[1fr_auto] items-baseline gap-4 py-4 text-sm">
                  <span>
                    <span className="text-muted">{x.en}</span>
                    <span className="mx-2 text-faint">→</span>
                    <span className="text-err">{x.de}</span>
                  </span>
                  <span className="text-right text-faint">reads as {x.reads}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* How it works */}
        <section className="mx-auto mt-36 max-w-[1200px] px-6">
          <Reveal>
            <SectionHead id="how" strong="A localizer that learns from someone else." rest="Every lesson comes from an independent panel, not from the model that made the mistake." />
          </Reveal>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.05}>
                <div className="h-full bg-bg p-6">
                  <div className="flex items-center justify-between">
                    <s.icon className="h-5 w-5 text-muted" strokeWidth={1.75} />
                    <span className="font-mono text-xs text-faint">0{i + 1}</span>
                  </div>
                  <p className="mt-8 text-[15px] leading-relaxed">
                    <span className="font-medium text-text">{s.title}</span> <span className="text-muted">{s.body}</span>
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-xs text-faint">A rule from the Germany playbook</p>
                <p className="mt-2 text-[15px] leading-relaxed">{sampleRule.text}</p>
              </div>
              <p className="shrink-0 font-mono text-[11px] text-faint">Taught by Reppo eval<br className="hidden sm:block" /> {sampleRule.sourceEvalId}</p>
            </div>
          </Reveal>
        </section>

        {/* Results */}
        <section className="mx-auto mt-36 max-w-[1200px] px-6">
          <Reveal>
            <SectionHead id="results" strong="Same listing, more rules, better score" rest={`${rounds.length} recorded rounds, scored by the Reppo panel out of 100`} />
          </Reveal>
          <Reveal>
            <div className="mt-10 rounded-2xl border border-line bg-panel p-6 sm:p-8">
              <RoundsChart rounds={rounds} />
            </div>
          </Reveal>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {[
              { name: "Crystal glassware set", a: r1, b: r5 },
              { name: "Sterling silver ring", a: r2, b: r6 },
            ].map((l, i) => (
              <Reveal key={l.name} delay={i * 0.05}>
                <div className="rounded-2xl border border-line bg-panel p-6">
                  <p className="text-sm text-muted">{l.name}, fixed twice from identical input</p>
                  <div className="mt-4 flex items-end gap-6">
                    <div>
                      <p className="font-mono text-4xl font-semibold tabular-nums text-faint">{l.a.fixScore}</p>
                      <p className="mt-1 text-xs text-faint">round {l.a.round} · {l.a.rulesUsed} rules</p>
                    </div>
                    <span className="pb-6 text-faint">→</span>
                    <div>
                      <p className="font-mono text-4xl font-semibold tabular-nums">{l.b.fixScore}</p>
                      <p className="mt-1 text-xs text-muted">round {l.b.round} · {l.b.rulesUsed} rules</p>
                    </div>
                  </div>
                  <p className="mt-5 font-mono text-[11px] leading-relaxed text-faint">Reppo {l.a.fixEvalId}<br />Reppo {l.b.fixEvalId}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-faint">
              Reppo scores vary between runs: the same Etsy translation scored 76 once and 45 another time. Comparing fixes of the same listing
              is the fairer measure, and it doesn&apos;t always go up: the candle listing scored 95 in round 3 and 93 in round 7. Every eval ID is in the{" "}
              <a href={`${REPO_URL}/tree/main/proof`} className="text-muted underline decoration-line-2 underline-offset-4 transition hover:text-text">proof data</a>.
            </p>
          </Reveal>
        </section>

        {/* Who it's for */}
        <section className="mx-auto mt-36 grid max-w-[1200px] items-center gap-12 px-6 md:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-line">
              <Image src={candles} alt="Hands holding a handmade candle in a glass jar" fill placeholder="blur" sizes="(min-width: 768px) 460px, 100vw" className="object-cover" />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <SectionHead strong="Made for sellers who ship abroad" rest="If you can't read the language your listing is shown in, Lokvane reads it for you." />
            <ul className="mt-8 divide-y divide-line border-y border-line text-[15px]">
              <li className="py-4"><span className="text-text">Handmade and vintage.</span> <span className="text-muted">Ceramics, candles, jewelry, prints, vintage finds.</span></li>
              <li className="py-4"><span className="text-text">One market at a time.</span> <span className="text-muted">Germany first, with its own playbook.</span></li>
              <li className="py-4"><span className="text-text">Nothing to set up.</span> <span className="text-muted">No account and no shop connection. Paste, check, copy the fix.</span></li>
            </ul>
          </Reveal>
        </section>

        {/* Built on */}
        <section className="mx-auto mt-36 max-w-[1200px] px-6">
          <Reveal>
            <SectionHead strong="Built on two independent systems" rest="One writes, the other judges" />
          </Reveal>
          <div className="mt-10 divide-y divide-line border-y border-line">
            {[
              { name: "SERV Reasoning by OpenServ", body: "Writes every fix and every playbook rule. Each call is schema-forced, so the app always gets the exact error list and rules it expects.", href: "https://docs.openserv.ai/serv-reasoning/introduction.md" },
              { name: "Reppo Evaluation API", body: "Provides every score and every lesson. An independent panel judges both versions, and its critiques are the only thing Lokvane learns from.", href: "https://eval.reppo.xyz/agents.md" },
            ].map((s) => (
              <Reveal key={s.name}>
                <a href={s.href} className="group grid gap-2 py-6 sm:grid-cols-[280px_1fr_auto] sm:items-center sm:gap-8">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-[15px] leading-relaxed text-muted">{s.body}</span>
                  <ArrowUpRight className="hidden h-4 w-4 text-faint transition group-hover:text-text sm:block" />
                </a>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto mb-24 mt-36 max-w-[1200px] px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-line">
              <Image src={shelf} alt="A shelf of lit candles" fill placeholder="blur" sizes="(min-width: 1200px) 1152px, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-black/60" />
              <div className="relative flex flex-col items-start gap-6 px-8 py-20 sm:px-14 sm:py-24">
                <h2 className="max-w-xl text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-[44px]">Check what your German buyers see</h2>
                <p className="max-w-md text-text/75">No account. Paste a listing and Etsy&apos;s translation, and get the fix in seconds.</p>
                <PrimaryLink href="/check">Check a listing</PrimaryLink>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
