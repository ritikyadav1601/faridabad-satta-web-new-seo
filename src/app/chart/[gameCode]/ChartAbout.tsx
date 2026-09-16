// Server-rendered "About this chart" + FAQ content. Purely informational
// copy (no betting instructions or promotional language), consistent with
// the site's own disclaimer that it's an independent information platform.
// Purpose: give each chart page genuine unique text beyond the numbers
// table, since Search Console showed most chart pages stuck as
// "Discovered - currently not indexed" — a classic thin/duplicate-content
// signal for pages that are otherwise just a results table.
interface ChartAboutProps {
  gameName: string; // e.g. "NEW GALI"
  resultTime: string | null;
}

function titleCase(name: string): string {
  return name
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function ChartAbout({ gameName, resultTime }: ChartAboutProps) {
  const name = titleCase(gameName);

  const faqs = [
    {
      q: `What does this ${name} chart show?`,
      a: `A month-by-month record of past ${name} results, laid out by date, so you can look up any previous day's number without searching through separate posts.`,
    },
    {
      q: `How often does the ${name} chart update?`,
      a: resultTime
        ? `${name} results are typically declared around ${resultTime} IST, and the chart above refreshes shortly after each day's result is published.`
        : `The chart above refreshes shortly after each day's ${name} result is published.`,
    },
    {
      q: `Can I see older ${name} records?`,
      a: `Yes — use the arrows above the table to move the six-month window backward or forward, or open the full-year archive from the Charts page for a complete January-to-December view.`,
    },
    {
      q: `Is this the official ${name} result source?`,
      a: `No. This is an independent informational platform that compiles and displays publicly available result data for reference; it does not run, operate, or influence the ${name} game itself.`,
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <section className="mt-10 border-t border-gray-100 pt-8">
      <h2 className="text-lg font-black text-gray-900 mb-2">About the {name} Chart</h2>
      <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">
        This page tracks {name} results over time in a single scannable table — every date lines
        up under its month, so you can check today&apos;s number or look back at any past result
        without leaving the page.
      </p>
      <div className="mt-6 space-y-4 max-w-3xl">
        {faqs.map(({ q, a }) => (
          <div key={q}>
            <h3 className="text-sm font-bold text-gray-800">{q}</h3>
            <p className="text-sm text-gray-500 mt-1">{a}</p>
          </div>
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </section>
  );
}
