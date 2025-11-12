import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BubbleAnalysis from "./components/BubbleAnalysis.jsx";
import FeedCard from "./components/FeedCard.jsx";
import SummaryPanel from "./components/SummaryPanel.jsx";
import {
  applyInteraction,
  buildAnalysisSnapshot,
  buildSummary,
  emptyPreferences,
  generatePersonalizedFeed
} from "./utils/algorithm.js";

const FEED_SIZE = 10;
const ROUNDS_TO_ANALYSIS = 3;
const ROUNDS_TO_SUMMARY = 7;

function App() {
  const [allPosts, setAllPosts] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [preferences, setPreferences] = useState(() => emptyPreferences());
  const [round, setRound] = useState(1);
  const [interactionsThisRound, setInteractionsThisRound] = useState(0);
  const [interactionLog, setInteractionLog] = useState([]);
  const [exposureLedger, setExposureLedger] = useState({});
  const [seenTopics, setSeenTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [lastAnalysisRound, setLastAnalysisRound] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [hasShownSummary, setHasShownSummary] = useState(false);
  const [isTransparent, setIsTransparent] = useState(false);
  const [sentimentExposure, setSentimentExposure] = useState({});

  const seenPostIdsRef = useRef(new Set());
  const interactedThisRoundRef = useRef(new Set());

  useEffect(() => {
    async function loadDataset() {
      try {
        const response = await fetch("/data/posts_grok copy.json");
        const dataset = await response.json();
        setAllPosts(dataset);
      } catch (error) {
        console.error("Nepodarilo sa načítať dataset príspevkov", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDataset();
  }, []);

  const allTopics = useMemo(() => {
    const topicSet = new Set(allPosts.map((post) => post.topic));
    return Array.from(topicSet);
  }, [allPosts]);

  const startNextRound = useCallback(
    ({ nextRound, nextPreferences, nextInteractionLog, transparentModeOverride, resetLedger = false }) => {
      if (!allPosts.length) {
        return;
      }

      const transparentMode = transparentModeOverride ?? isTransparent;
      const diversityRatio = transparentMode
        ? 0.7
        : Math.max(0.36 - (nextRound - 1) * 0.06, 0.08);

      const shouldReset = resetLedger || (transparentMode && nextRound === 1);
      const seedSeenIds = shouldReset ? new Set() : seenPostIdsRef.current;

      const feed = generatePersonalizedFeed({
        posts: allPosts,
        preferences: nextPreferences,
        seenPostIds: seedSeenIds,
        feedSize: FEED_SIZE,
        diversityRatio,
        round: nextRound,
        transparentMode
      });

      const projectedTopicsSet = shouldReset ? new Set() : new Set(seenTopics);
      const projectedLedger = shouldReset ? {} : { ...exposureLedger };
      const projectedSentimentLedger = shouldReset ? {} : { ...sentimentExposure };
      const activeSeenIds = seedSeenIds;

      feed.forEach((post) => {
        projectedTopicsSet.add(post.topic);
        projectedLedger[post.topic] = (projectedLedger[post.topic] ?? 0) + 1;
        const sentimentKey = post.sentiment ?? "neutral";
        projectedSentimentLedger[sentimentKey] = (projectedSentimentLedger[sentimentKey] ?? 0) + 1;
        activeSeenIds.add(post.id);
      });

      const projectedTopics = Array.from(projectedTopicsSet);

      setFeedPosts(feed);
      setSeenTopics(projectedTopics);
      setExposureLedger(projectedLedger);
      setSentimentExposure(projectedSentimentLedger);
      seenPostIdsRef.current = activeSeenIds;
      interactedThisRoundRef.current = new Set();
      setInteractionsThisRound(0);

      if (!transparentMode) {
        if (nextRound % ROUNDS_TO_ANALYSIS === 0 && lastAnalysisRound !== nextRound) {
          const snapshot = buildAnalysisSnapshot({
            feed,
            allTopics,
            seenTopics: projectedTopics,
            exposureLedger: projectedLedger,
            round: nextRound,
            interactionCount: nextInteractionLog.length,
            preferences: nextPreferences
          });
          setAnalysisData(snapshot);
          setShowAnalysis(true);
          setLastAnalysisRound(nextRound);
        }

        if (nextRound >= ROUNDS_TO_SUMMARY && !hasShownSummary) {
          const summary = buildSummary({
            preferences: nextPreferences,
            allTopics,
            seenTopics: projectedTopics,
            interactionLog: nextInteractionLog,
            exposureLedger: projectedLedger,
            sentimentExposure: projectedSentimentLedger
          });
          setSummaryData(summary);
          setShowSummary(true);
          setHasShownSummary(true);
        }
      }
    },
    [allPosts, allTopics, exposureLedger, hasShownSummary, isTransparent, lastAnalysisRound, seenTopics, sentimentExposure]
  );

  useEffect(() => {
    if (isLoading || !allPosts.length || feedPosts.length) {
      return;
    }
    const baseline = emptyPreferences();
    setPreferences(baseline);
    startNextRound({
      nextRound: 1,
      nextPreferences: baseline,
      nextInteractionLog: [],
      transparentModeOverride: false
    });
  }, [allPosts.length, feedPosts.length, isLoading, startNextRound]);

  const handleInteraction = useCallback(
    (postId) => {
      const target = feedPosts.find((post) => post.id === postId);
      if (!target) {
        return;
      }

      const nextPreferences = applyInteraction(preferences, "like", target);
      const entry = {
        id: target.id,
        action: "like",
        topic: target.topic,
        sentiment: target.sentiment,
        intensity: target.intensity,
        round
      };
      const nextLog = [...interactionLog, entry];

      setPreferences(nextPreferences);
      setInteractionLog(nextLog);
      interactedThisRoundRef.current.add(postId);
      setFeedPosts((prev) => prev.filter((post) => post.id !== postId));
      setSeenTopics((prev) => {
        const updated = new Set(prev);
        updated.add(target.topic);
        return Array.from(updated);
      });
      setInteractionsThisRound((previous) => previous + 1);
    },
    [feedPosts, interactionLog, preferences, round]
  );

  const handleNextRound = useCallback(() => {
    if (!feedPosts.length) {
      return;
    }

    let updatedPreferences = preferences;
    let preferencesChanged = false;
    const passivePosts = feedPosts.filter((post) => !interactedThisRoundRef.current.has(post.id));

    if (passivePosts.length) {
      passivePosts.forEach((post) => {
        updatedPreferences = applyInteraction(updatedPreferences, "scroll", post);
      });
      preferencesChanged = true;
    }

    if (preferencesChanged) {
      setPreferences(updatedPreferences);
    }

    const nextLog = interactionLog;
    const upcomingRound = round + 1;
    setRound(upcomingRound);

    startNextRound({
      nextRound: upcomingRound,
      nextPreferences: updatedPreferences,
      nextInteractionLog: nextLog
    });

    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [feedPosts, interactionLog, preferences, round, startNextRound]);

  const handleShowSummary = useCallback(() => {
    const summary = buildSummary({
      preferences,
      allTopics,
      seenTopics,
      interactionLog,
      exposureLedger,
      sentimentExposure
    });
    setSummaryData(summary);
    setShowSummary(true);
  }, [allTopics, exposureLedger, interactionLog, preferences, seenTopics, sentimentExposure]);

  const handleCloseAnalysis = () => setShowAnalysis(false);
  const handleCloseSummary = () => setShowSummary(false);

  const handleResetAlgorithm = useCallback(() => {
    const resetPrefs = emptyPreferences();
    setPreferences(resetPrefs);
    setInteractionLog([]);
    setExposureLedger({});
    setSentimentExposure({});
    setSeenTopics([]);
    setRound(1);
    setLastAnalysisRound(0);
    setHasShownSummary(false);
    setShowAnalysis(false);
    setShowSummary(false);
    setSummaryData(null);
    setAnalysisData(null);
    setIsTransparent(true);
    setInteractionsThisRound(0);
    seenPostIdsRef.current = new Set();
    interactedThisRoundRef.current = new Set();

    startNextRound({
      nextRound: 1,
      nextPreferences: resetPrefs,
      nextInteractionLog: [],
      transparentModeOverride: true,
      resetLedger: true
    });
  }, [startNextRound]);

  const handleRestartSimulation = useCallback(() => {
    const baseline = emptyPreferences();
    setPreferences(baseline);
    setInteractionLog([]);
    setExposureLedger({});
  setSentimentExposure({});
    setSeenTopics([]);
    setRound(1);
  setLastAnalysisRound(0);
    setHasShownSummary(false);
    setShowAnalysis(false);
    setShowSummary(false);
    setSummaryData(null);
    setAnalysisData(null);
    setIsTransparent(false);
    setInteractionsThisRound(0);
    seenPostIdsRef.current = new Set();
    interactedThisRoundRef.current = new Set();

    startNextRound({
      nextRound: 1,
      nextPreferences: baseline,
      nextInteractionLog: [],
      transparentModeOverride: false,
      resetLedger: true
    });
  }, [startNextRound]);

  const progress = Math.min((interactionsThisRound / FEED_SIZE) * 100, 100);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-base text-slate-200">
        Načítavam obsah...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-base via-slate-900 to-brand-base">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 pb-16 pt-10 sm:gap-10 sm:px-6 sm:pb-20 sm:pt-14 lg:px-10">
        <header className="space-y-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="w-full text-center sm:w-auto sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.6em] text-brand-soft/70">
                Interaktívna simulácia
              </p>
              <h1 className="mt-2 text-center text-3xl font-semibold text-slate-50 sm:text-left sm:text-5xl">
                Mimo moju bublinu
              </h1>
            </div>
            <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
              <div className="rounded-full border border-white/10 bg-brand-base/40 px-6 py-3 text-center text-sm text-slate-200">
                {isTransparent ? "Transparentný režim" : `Kolo ${round}`}
              </div>
              <button
                type="button"
                onClick={handleRestartSimulation}
                className="rounded-full border border-white/15 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-100 transition hover:bg-white/10"
              >
                {isTransparent ? "Spusti algoritmus nanovo" : "Reštart simulácie"}
              </button>
            </div>
          </div>
          <p className="mx-auto max-w-3xl text-center text-sm leading-relaxed text-slate-300/90 sm:text-left sm:text-base">
            Sleduj, ako algoritmus reaguje na tvoje signály. Každá reakcia posúva feed bližšie k tomu,
            čo už poznáš – a vzdialenejšie od tém, ktoré by ťa mohli prekvapiť.
          </p>

          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-accent via-violet-500 to-rose-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

  <main className="grid gap-5 sm:grid-cols-1 md:grid-cols-2 md:gap-6">
          {feedPosts.map((post) => (
            <FeedCard key={post.id} post={post} onInteract={() => handleInteraction(post.id)} />
          ))}
          {!feedPosts.length && (
            <div className="col-span-2 rounded-3xl border border-dashed border-white/10 p-10 text-center text-slate-300/80">
              Algoritmus pripravuje nové kolo obsahu...
            </div>
          )}
        </main>

        <div className="rounded-3xl border border-white/10 bg-brand-base/60 p-4 shadow-card backdrop-blur-sm sm:flex sm:items-center sm:justify-between sm:p-5">
          <div className="mb-4 text-center text-sm text-slate-300/90 sm:mb-0 sm:text-left">
            <p>Označ príspevky, ktoré ťa oslovujú, potom sa posuň na ďalšie kolo.</p>
            <p className="mt-2 text-xs text-slate-400 sm:mt-1">Kedykoľvek si môžeš pozrieť rekapituláciu toho, čo algoritmus sleduje.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleShowSummary}
              className="w-full rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-base sm:w-auto"
            >
              Zrekapituluj výsledky
            </button>
            <button
              type="button"
              onClick={handleNextRound}
              disabled={!feedPosts.length}
              className="w-full rounded-full bg-brand-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-accent/40 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-base disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              Další příspěvky
            </button>
          </div>
        </div>

        <footer className="mt-auto flex flex-wrap items-center justify-between gap-4 text-center text-xs text-slate-400 sm:text-left">
          <span className="w-full sm:w-auto">Témy, ktoré ešte vidíš: {seenTopics.join(", ") || "–"}</span>
          <span className="w-full sm:w-auto">Celkový počet interakcií: {interactionLog.length}</span>
        </footer>
      </div>

      {showAnalysis && analysisData ? (
        <BubbleAnalysis data={analysisData} onClose={handleCloseAnalysis} />
      ) : null}

      {showSummary && summaryData ? (
        <SummaryPanel
          data={summaryData}
          onReset={handleResetAlgorithm}
          onClose={handleCloseSummary}
        />
      ) : null}
    </div>
  );
}

export default App;
