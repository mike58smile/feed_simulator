import { useMemo } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SummaryPanel({ data, onReset, onClose }) {
  const {
    narrowing,
    lostTopics,
    preferenceBreakdown,
    sentimentLean,
    totalInteractions,
    exposureLedger,
    likesByTopic,
    sentimentAxis,
    sentimentBreakdown,
    preferenceRange
  } = data;

  const chartData = useMemo(() => {
    const labels = Object.keys(exposureLedger ?? {});
    const values = Object.values(exposureLedger ?? {});

    if (!labels.length || !values.some((value) => value > 0)) {
      return {
        labels: ["Zatiaľ žiadne dáta"],
        datasets: [
          {
            data: [1],
            backgroundColor: ["#334155"],
            borderWidth: 0,
            hoverOffset: 0
          }
        ]
      };
    }

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
  }, [exposureLedger]);

  const neutralSentiment = sentimentBreakdown?.find((item) => item.key === "neutral");
  const positiveAxis = sentimentAxis?.positive ?? { count: 0, percentage: 0 };
  const negativeAxis = sentimentAxis?.negative ?? { count: 0, percentage: 0 };
  const formattedMinPreference =
    typeof preferenceRange?.min === "number" ? preferenceRange.min.toFixed(1) : "–";
  const formattedMaxPreference =
    typeof preferenceRange?.max === "number" ? preferenceRange.max.toFixed(1) : "–";
  const normalizationBase = Math.max(
    Math.abs(preferenceRange?.max ?? 1),
    Math.abs(preferenceRange?.min ?? 1),
    0.1
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-base/95 px-4 py-8 sm:px-6 sm:py-12">
      <div className="glass-panel w-full max-w-3xl rounded-3xl border border-white/10 p-6 shadow-card sm:p-8 lg:p-10 max-h-[90vh] overflow-y-auto">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-soft/80">
              Edukačný moment
            </p>
            <h2 className="text-2xl font-semibold text-white md:text-3xl lg:text-4xl">
              Tvoj informačný svet sa zúžil o {narrowing}% tém
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300/90">
              Algoritmus posilňoval signály, ktoré si mu dával. Čím viac reaguješ na podobný
              obsah, tým menej iných perspektív zostane v tvojom feede.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-brand-base/40 px-6 py-4 text-center text-sm text-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-400">Interakcie</p>
            <p className="mt-1 text-2xl font-semibold text-white">{totalInteractions}</p>
            {sentimentLean ? (
              <p className="mt-2 text-xs text-slate-400">
                Dominantný sentiment: <span className="font-semibold text-slate-200">{sentimentLean.label}</span>
              </p>
            ) : null}
          </div>
        </header>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-white/5 bg-brand-base/40 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-4">
              Rozloženie zobrazených tém
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
                        boxWidth: 12,
                        padding: 10,
                        font: {
                          size: 11
                        }
                      }
                    }
                  }
                }}
              />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-400">
              Graf ukazuje podiel tém, ktoré ti algoritmus reálne zobrazoval v posledných kolách.
            </p>
          </section>

          <section className="rounded-3xl border border-white/5 bg-brand-base/40 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Čo zmizlo z tvojho feedu
            </h3>
            {lostTopics.length ? (
              <p className="mt-4 text-sm text-slate-300/90">{lostTopics.join(", ")}</p>
            ) : (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-emerald-400">
                  ✓ Videl si všetky dostupné témy
                </p>
                <p className="text-xs text-slate-400">
                  Algoritmus mal dosť kôl na to, aby ukázal celé spektrum obsahu
                </p>
              </div>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-white/5 bg-brand-base/40 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Tvoje preferencie
            </h3>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Zoznam ukazuje, čo sa algoritmus naučil preferovať do budúcna. Nezamieňaj si to s grafom
            vľavo – ten hovorí o tom, čo si už videl.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {preferenceBreakdown?.map((item) => {
              const magnitude = Math.min(
                (Math.abs(item.score) / normalizationBase) * 100,
                100
              );
              const barColor = item.score >= 0
                ? "bg-gradient-to-r from-brand-accent to-emerald-400"
                : "bg-gradient-to-r from-rose-500 to-orange-500";

              return (
                <div
                  key={item.topic}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-brand-base/40 px-3 py-2"
                >
                  <div>
                    <span className="text-sm font-medium capitalize text-slate-200">{item.topic}</span>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      {item.score >= 0 ? "Uprednostňuje" : "Potláča"}
                    </p>
                  </div>
                  <div className="flex w-32 items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div className={`h-full ${barColor}`} style={{ width: `${magnitude}%` }} />
                    </div>
                    <span className="w-10 text-right text-xs font-semibold text-brand-soft">
                      {item.score.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
            {!preferenceBreakdown?.length && (
              <p className="text-sm text-slate-400">
                Algoritmus ešte nemá dosť dát na vyhodnotenie preferencií.
              </p>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/5 bg-brand-base/40 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
            Koľkokrát si stlačil "Páči sa mi"
          </h3>
          {likesByTopic?.length ? (
            <div className="mt-4 space-y-3">
              {likesByTopic.map((item) => (
                <div
                  key={item.topic}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-brand-base/40 px-4 py-3 text-sm text-slate-200"
                >
                  <span className="font-medium capitalize">{item.topic}</span>
                  <span className="text-brand-soft">{item.count}×</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">
              Zatiaľ si žiadny príspevok neoznačil ako "Páči sa mi".
            </p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Pomery ukazujú, na ktoré témy si algoritmu poslal najsilnejší signál.
          </p>
        </section>

        <section className="mt-6 rounded-3xl border border-white/5 bg-brand-base/40 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
            Nálada obsahu vo feede
          </h3>
          {positiveAxis.count === 0 && negativeAxis.count === 0 ? (
            <p className="mt-4 text-sm text-slate-400">
              Na určenie nálady ešte nemáme dostatok zobrazení. Sleduj feed a skús zopár reakcií.
            </p>
          ) : (
            <div className="mt-4">
              <div className="flex justify-between text-xs uppercase tracking-wide text-slate-400">
                <span>Negatívny obsah</span>
                <span>Pozitívny obsah</span>
              </div>
              <div className="relative mt-3 h-2 w-full rounded-full bg-white/10">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-rose-500/80"
                  style={{ width: `${Math.min(negativeAxis.percentage, 100)}%` }}
                />
                <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/20" />
                <div
                  className="absolute right-0 top-0 h-full rounded-full bg-emerald-400/80"
                  style={{ width: `${Math.min(positiveAxis.percentage, 100)}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-xs text-slate-400">
                <span>
                  {negativeAxis.percentage}% ({negativeAxis.count} zobrazení)
                </span>
                <span className="text-right">
                  {positiveAxis.percentage}% ({positiveAxis.count} zobrazení)
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Neutrálne príspevky: {neutralSentiment?.percentage ?? 0}% ({neutralSentiment?.count ?? 0} zobrazení)
              </p>
            </div>
          )}
        </section>

        <footer className="mt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-300/90">
            Transparentný režim obnoví diverzitu a ukáže spektrum názorov naprieč témami.
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/15 px-5 py-3 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Naspäť do bubliny
            </button>
            <button
              type="button"
              onClick={onReset}
              className="rounded-full bg-brand-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-accent/40 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Zmeň algoritmus
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
