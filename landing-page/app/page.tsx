import {
  ArrowUpRight,
  AudioLines,
  Bird,
  Binoculars,
  MapPinned,
  Radar,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import ScrollExpandMedia from '@/components/ui/scroll-expansion-hero';

const featureCards = [
  {
    icon: AudioLines,
    title: 'Hear the pattern',
    copy: 'Turn a dense chorus into a clear stream of recognizable calls, moments, and changes.',
  },
  {
    icon: Radar,
    title: 'Spot what shifts',
    copy: 'Compare listening windows over time and surface signals that deserve a closer look.',
  },
  {
    icon: ShieldCheck,
    title: 'Act with context',
    copy: 'Carry field-ready observations into conservation conversations, not disconnected spreadsheets.',
  },
];

const steps = [
  ['01', 'Listen', 'Capture a short stretch of habitat sound from the places you care about.'],
  ['02', 'Sense', 'BirdSense shapes the raw soundscape into an interpretable ecological signal.'],
  ['03', 'Share', 'Bring a living, local story to teams, communities, and conservation decisions.'],
];

export default function Home() {
  return (
    <main className="noise-surface min-h-screen overflow-x-hidden bg-[#050807] text-[#EDF5ED]">
      <header className="fixed inset-x-0 top-0 z-50 mx-auto flex max-w-[1800px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <a
          href="#top"
          className="group inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-black/25 px-3 py-2 backdrop-blur-md transition hover:border-[#FCD106] focus:outline-none focus:ring-2 focus:ring-[#FCD106]"
          aria-label="BirdSense home"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#FCD106] text-black transition-transform group-hover:-rotate-12">
            <Bird className="h-4 w-4" strokeWidth={2.4} />
          </span>
          <span className="text-sm font-black uppercase tracking-[-0.05em] text-white">BirdSense</span>
        </a>

        <nav className="hidden items-center gap-6 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/70 md:flex">
          <a className="transition hover:text-[#FCD106]" href="#why-birdsense">
            Why BirdSense
          </a>
          <a className="transition hover:text-[#FCD106]" href="#how-it-works">
            How it works
          </a>
          <a className="transition hover:text-[#FCD106]" href="#field-notes">
            Field notes
          </a>
        </nav>

        <a
          href="#field-notes"
          className="inline-flex items-center gap-2 rounded-full bg-[#FCD106] px-3.5 py-2 text-[0.62rem] font-black uppercase tracking-[0.13em] text-black transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#FCD106] focus:ring-offset-2 focus:ring-offset-[#050807] sm:px-4 sm:text-xs"
        >
          Explore
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
        </a>
      </header>

      <div id="top">
        <ScrollExpandMedia
          mediaType="image"
          mediaSrc="https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=1800&q=90"
          bgImageSrc="https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=2400&q=90"
          title="Listen Closer"
          date="BirdSense · Field intelligence for living landscapes"
          scrollToExpand="Enter the soundscape"
          textBlend
        >
          <div className="relative bg-[#050807]">
            <div aria-hidden="true" className="hairline-grid absolute inset-0 opacity-40" />

            <section
              id="why-birdsense"
              className="relative mx-auto grid max-w-7xl gap-10 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:px-12"
            >
              <div className="max-w-2xl">
                <p className="mb-5 text-xs font-black uppercase tracking-[0.23em] text-[#FCD106]">The signal is already there</p>
                <h2 className="text-balance text-4xl font-black uppercase leading-[0.92] tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl">
                  Hear what the canopy is trying to tell you.
                </h2>
                <p className="mt-7 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
                  Every habitat has a pulse. BirdSense helps field teams and curious communities listen for the
                  rhythms within it—then turn those moments into clearer, more grounded action.
                </p>
              </div>

              <div className="grid gap-3 self-end sm:grid-cols-3 lg:grid-cols-1">
                {featureCards.map(({ icon: Icon, title, copy }, index) => (
                  <article
                    key={title}
                    className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[#FCD106]/60 hover:bg-white/[0.07] sm:p-6"
                  >
                    <div className="mb-8 flex items-center justify-between lg:mb-5">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#FCD106] text-black">
                        <Icon className="h-5 w-5" strokeWidth={2.3} />
                      </span>
                      <span className="text-xs font-bold tracking-[0.18em] text-white/35">0{index + 1}</span>
                    </div>
                    <h3 className="text-xl font-black tracking-[-0.045em] text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/60">{copy}</p>
                  </article>
                ))}
              </div>
            </section>

            <section id="how-it-works" className="relative border-y border-white/10 bg-black/25">
              <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-28 lg:px-12">
                <div className="flex max-w-3xl flex-col gap-5">
                  <p className="text-xs font-black uppercase tracking-[0.23em] text-[#CE1126]">From sound to stewardship</p>
                  <h2 className="text-balance text-4xl font-black uppercase leading-[0.92] tracking-[-0.065em] text-white sm:text-6xl">
                    Small observations. A wider view.
                  </h2>
                </div>

                <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3">
                  {steps.map(([number, title, copy]) => (
                    <li key={number} className="min-h-[18rem] bg-[#090d0a] p-6 sm:p-8">
                      <span className="text-5xl font-black tracking-[-0.08em] text-[#FCD106]">{number}</span>
                      <h3 className="mt-16 text-3xl font-black uppercase tracking-[-0.06em] text-white">{title}</h3>
                      <p className="mt-3 max-w-xs text-sm leading-6 text-white/60">{copy}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            <section
              id="field-notes"
              className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[0.88fr_1.12fr] lg:gap-20 lg:px-12"
            >
              <div className="rounded-[2rem] border border-[#FCD106]/45 bg-[#FCD106] p-6 text-black shadow-[0_22px_70px_rgba(252,209,6,0.15)] sm:p-8">
                <div className="flex items-center justify-between border-b border-black/15 pb-6">
                  <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em]">
                    <Sparkles className="h-4 w-4" />
                    Field note 07
                  </span>
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#CE1126]" />
                </div>
                <p className="mt-10 text-sm font-bold uppercase tracking-[0.16em] text-black/60">Listening window</p>
                <p className="mt-2 text-5xl font-black uppercase leading-none tracking-[-0.08em] sm:text-6xl">06:14 AM</p>
                <div className="mt-12 grid grid-cols-2 gap-4 border-t border-black/15 pt-6 text-sm">
                  <div>
                    <p className="font-black uppercase tracking-[0.12em] text-black/55">Location</p>
                    <p className="mt-1 font-bold">Forest edge</p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-[0.12em] text-black/55">Mood</p>
                    <p className="mt-1 font-bold">Awakening</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.23em] text-[#FCD106]">
                  <MapPinned className="h-4 w-4" />
                  Made for the places that matter
                </p>
                <h2 className="text-balance text-4xl font-black uppercase leading-[0.92] tracking-[-0.065em] text-white sm:text-6xl">
                  Keep the field close, even after you leave it.
                </h2>
                <p className="mt-7 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
                  BirdSense is a landing point for observations that deserve a second listen. Bring back the
                  temperature of a place, not just a row of data.
                </p>
                <a
                  href="#top"
                  className="mt-9 inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-xs font-black uppercase tracking-[0.15em] text-white transition hover:border-[#FCD106] hover:bg-[#FCD106] hover:text-black focus:outline-none focus:ring-2 focus:ring-[#FCD106]"
                >
                  Return to the canopy
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </section>

            <footer className="relative border-t border-white/10 px-5 py-8 sm:px-8 lg:px-12">
              <div className="mx-auto flex max-w-7xl flex-col gap-5 text-xs font-bold uppercase tracking-[0.15em] text-white/45 sm:flex-row sm:items-center sm:justify-between">
                <span className="inline-flex items-center gap-2 text-white/75">
                  <Binoculars className="h-4 w-4 text-[#FCD106]" /> BirdSense
                </span>
                <span>Listen closer. Care deeper.</span>
              </div>
            </footer>
          </div>
        </ScrollExpandMedia>
      </div>
    </main>
  );
}
