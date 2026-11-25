import { LEGAL_UPDATED } from '../content/legal';

// Renders a Terms / Privacy document from src/content/legal.js
export default function LegalDoc({ doc }) {
  return (
    <article className="text-sm leading-relaxed">
      <p className="text-forest-200/50 text-xs mb-4">Last updated {LEGAL_UPDATED}</p>
      <p className="text-forest-200/80 mb-5">{doc.intro}</p>
      {doc.sections.map(s => (
        <section key={s.h} className="mb-5">
          <h3 className="text-white font-heading font-bold text-base mb-2">{s.h}</h3>
          <ul className="space-y-1.5 text-forest-200/75">
            {s.p.map((t, i) => (
              <li key={i} className="flex gap-2"><span className="text-ember-500 mt-[.55em] w-1.5 h-1.5 rounded-full bg-ember-500 shrink-0" />{t}</li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  );
}
