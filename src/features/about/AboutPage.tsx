import { Link } from 'react-router'
import type { TrustLevel } from '@/types'
import { CONTACT_EMAIL, MIXER_URL } from '@/types'
import { TRUST_META } from '@/lib/recipe/trust'
import { TrustBadge } from '@/components/recipe/badges'

const LEVELS: TrustLevel[] = ['calculated', 'tested', 'reproduced', 'highly-reproduced']

/** The "how it works" explanations that used to be marketed on the homepage. */
export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">About SpoolShare</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
        SpoolShare is a community library of filament colors that people have actually mixed and printed, along with the
        recipes to reproduce them. It’s made for the{' '}
        <a href={MIXER_URL} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">Multi-Color Filament Mixer</a>{' '}
        by jetpad on MakerWorld: load 4 filaments into the AMS, print the mixer, and out comes a new single-color filament
        that you can feed back in for further mixing.
      </p>

      <Section title="Recipes and stages">
        <p>
          Each stage fills the mixer’s 4 slots, so single-print ratios are 1:1, 3:1, 2:1:1 or 1:1:1:1. Finer colors come from
          multiple stages: print a diluted intermediate, then load it into a slot for the next print. SpoolShare keeps the
          whole genealogy and calculates the true final composition, so
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><b>Diluted Blue</b> = 3 White + 1 Cobalt</li>
          <li><b>Double Diluted Blue</b> = 2 White + 2 Diluted Blue</li>
          <li><b>Lavender</b> = 2 White + 1 Pink + 1 Double Diluted Blue</li>
        </ul>
        <p className="mt-2">really contains 71.875% White, 25% Pink and 3.125% Cobalt. Every recipe page shows this “true final composition” and a gram calculator.</p>
      </Section>

      <Section title="How reliability works">
        <p>A single upload is never treated as proof. Confidence grows only as other makers reproduce a color and get a close match.</p>
        <dl className="mt-3 divide-y divide-border rounded-md border border-border bg-surface">
          {LEVELS.map((l) => (
            <div key={l} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4">
              <dt className="w-44 shrink-0"><TrustBadge level={l} size="sm" /></dt>
              <dd className="text-sm text-fg-muted">{TRUST_META[l].description}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3">
          “Close match” means a CIEDE2000 color difference (ΔE00) of 5 or less between photographed swatches. ΔE00 is a
          perceptual measure: around 1 is barely noticeable and above 10 is clearly a different color.
        </p>
      </Section>

      <Section title="Why physically printed colors?">
        <p>
          Melted, pigmented plastic doesn’t mix like light or like HEX codes. A small amount of a strong pigment such as cobalt
          blue dominates a mix, translucent filaments tint weakly, and brands load pigment differently. SpoolShare can show a
          calculated preview (a Kubelka–Munk pigment estimate), but it’s always labeled <i>Calculated / Untested</i>. Real
          printed swatches and community reproductions always win.
        </p>
        <p className="mt-2">
          Filament HEX values in the catalog are display approximations, not measurements. Photograph swatches in bright,
          neutral daylight without filters, and consider printing the{' '}
          blank standard test swatch (<a href={`${import.meta.env.BASE_URL}downloads/SpoolShareSwatch.3mf`} download className="font-medium text-accent hover:underline">3MF</a>
          {' / '}<a href={`${import.meta.env.BASE_URL}downloads/SpoolShareSwatch.stl`} download className="font-medium text-accent hover:underline">STL</a>, optional)
          so everyone compares the same flat surface.
        </p>
      </Section>

      <Section title="Print ideas and links">
        <p>
          Recipes can suggest what a color looks great on, sometimes linking to models on MakerWorld, Printables or other
          sites. Those models belong to their creators and are hosted elsewhere; SpoolShare only links to them.
        </p>
      </Section>

      <Section title="Suggestions and contact">
        <p>
          Have a recommendation, found a problem, or want a filament added? Email the official SpoolShare account at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-accent hover:underline">{CONTACT_EMAIL}</a>.
        </p>
      </Section>

      <p className="mt-10 text-sm text-fg-muted">
        Ready to browse? <Link to="/" className="font-medium text-accent hover:underline">Explore colors</Link> or{' '}
        <Link to="/create" className="font-medium text-accent hover:underline">share one you’ve made</Link>.
      </p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 text-[15px] leading-relaxed text-fg-muted">{children}</div>
    </section>
  )
}
