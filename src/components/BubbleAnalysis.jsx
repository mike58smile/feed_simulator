import { useMemo } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function BubbleAnalysis({ data, onClose }) {
  const chartData = useMemo(() => {
    const labels = Object.keys(data.topicDistribution);
    const values = Object.values(data.topicDistribution);

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "#5A7BFF",
            "#F472B6",
            "#34D399",
            "#FACC15",
            "#38BDF8",
            "#FB7185",
            "#A855F7",
            "#F97316"
          ],
          borderWidth: 0,
          hoverOffset: 8
        }
      ]
    };
  }, [data.topicDistribution]);

  const hiddenTopics = data.hiddenTopics.length ? data.hiddenTopics.join(", ") : "Zatiaľ žiadne";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-brand-base/90 px-4 py-6 sm:px-6 sm:py-10">
      <div className="glass-panel relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-white/8 shadow-card overflow-hidden">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-brand-soft/80">
                  Analýza bubliny
                </p>
                <h2 className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-semibold text-white leading-tight">
                  Tvoj výber sa zužuje o {data.narrowing}% tém
                </h2>
              </div>
              {/* Desktop button */}
              <button
                type="button"
                onClick={onClose}
                className="hidden sm:block rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 whitespace-nowrap"
              >
                Pokračovať
              </button>
            </div>
          </div>

        <div className="grid gap-4 sm:gap-6 md:gap-8 md:grid-cols-2">
          <div className="rounded-2xl sm:rounded-3xl border border-white/5 bg-brand-base/60 p-4 sm:p-6">
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-slate-300 mb-3">
              Čo teraz vidíš
            </h3>
            <div className="max-w-[280px] sm:max-w-full mx-auto">
              <Pie
                data={chartData}
                options={{
                  plugins: {
                    legend: {
                      display: true,
                      position: "bottom",
                      labels: {
                        color: "#E2E8F0",
                        boxWidth: 10,
                        padding: 8,
                        font: {
                          size: 11
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <section className="rounded-2xl sm:rounded-3xl border border-white/5 bg-brand-base/50 p-4 sm:p-6">
              <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-slate-300">
                Preferované témy algoritmu
              </h3>
              {data.preferenceHighlights.length ? (
                <ul className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                  {data.preferenceHighlights.map((item) => (
                    <li key={item.topic} className="flex items-center justify-between text-xs sm:text-sm text-slate-200">
                      <span className="flex items-center gap-2 sm:gap-3">
                        <span
                          className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate">{item.topic}</span>
                      </span>
                      <span className="font-semibold text-brand-soft ml-2">{item.score}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-300/80">
                  Algoritmus ešte nevytvoril výrazné preferencie, pokračuj v skúmaní feedu.
                </p>
              )}
            </section>

            <section className="rounded-2xl sm:rounded-3xl border border-white/5 bg-brand-base/50 p-4 sm:p-6">
              <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-slate-300">
                Témy mimo tvoju bublinu
              </h3>
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-slate-300/90">{hiddenTopics}</p>
              <div className="mt-3 sm:mt-4 text-xs text-slate-400 space-y-1">
                <p>
                  Počet interakcií: <span className="font-semibold text-slate-200">{data.interactionCount}</span>
                </p>
                <p>
                  Kolá personalizácie: <span className="font-semibold text-slate-200">{data.round}</span>
                </p>
              </div>
            </section>

            <section className="rounded-2xl sm:rounded-3xl border border-white/5 bg-brand-base/40 p-4 sm:p-6">
              <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-slate-300">
                Sentiment obsahu
              </h3>
              <ul className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-200">
                {Object.entries(data.sentimentMix).map(([key, value]) => (
                  <li key={key} className="flex items-center justify-between">
                    <span className="uppercase tracking-wide text-slate-400">{key}</span>
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
        </div>

        {/* Mobile button at bottom */}
        <div className="sm:hidden border-t border-white/10 bg-brand-base/80 backdrop-blur-sm p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-brand-soft/20 border border-brand-soft/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-soft/30"
          >
            Pokračovať vo feede
          </button>
        </div>
      </div>
    </div>
  );
}
