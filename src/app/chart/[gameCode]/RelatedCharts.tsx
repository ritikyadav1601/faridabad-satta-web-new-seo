import Link from "next/link";

interface RelatedChartsProps {
  games: { slug: string; label: string }[];
}

// Cross-links to a handful of other curated chart pages. Previously the
// homepage's results table was the ONLY page anywhere linking to individual
// /chart/[gameCode] pages, so all internal link equity pooled there instead
// of flowing between chart pages themselves. This spreads it around.
export default function RelatedCharts({ games }: RelatedChartsProps) {
  if (!games.length) return null;

  return (
    <section className="mt-8 border-t border-gray-100 pt-6">
      <h2 className="text-sm font-black uppercase tracking-wide text-gray-500 mb-3">
        Other Charts
      </h2>
      <div className="flex flex-wrap gap-2">
        {games.map(({ slug, label }) => (
          <Link
            key={slug}
            href={`/chart/${slug}`}
            className="rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-xs font-bold text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            {label} Chart
          </Link>
        ))}
      </div>
    </section>
  );
}
