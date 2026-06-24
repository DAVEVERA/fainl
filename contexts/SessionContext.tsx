import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  FC,
  ReactNode,
} from "react";
import {
  DEFAULT_COUNCIL,
  DEFAULT_CHAIRMAN,
  USAGE_LIMITS,
  PRICING,
} from "../constants";
import {
  CouncilResponse,
  WorkflowStage,
  SessionState,
  AppConfig,
  DebateMessage,
  CouncilMember,
} from "../types";
import { UnifiedCouncilService } from "../services/councilService";
import { supabase } from "../services/supabaseClient";
import { useAuth, UserProfile } from "./AuthContext";

// ─── Constants ─────────────────────────────────────────────────────────────

const SESSION_RECOVERY_KEY = "fainl_session_recovery";

// ─── Default Config ────────────────────────────────────────────────────────

const defaultConfig: AppConfig = {
  googleKey: "",
  openRouterKey: "",
  openaiKey: "",
  anthropicKey: "",
  deepseekKey: "",
  groqKey: "",
  mistralKey: "",
  customKey: "",
  mimoKey: "",
  devstralKey: "",
  katKey: "",
  olmoKey: "",
  nemotronKey: "",
  gemmaKey: "",
  glmKey: "",
  activeCouncil: DEFAULT_COUNCIL,
  customNodes: [],
  chairmanId: DEFAULT_CHAIRMAN.id,
  modelCount: 3,
  turnsUsed: 0,
  creditsRemaining: 0,
  isLifetime: false,
  totalTurnsAllowed: 2,
};

// ─── normalizeConfig ───────────────────────────────────────────────────────

export const normalizeConfig = (raw: any): AppConfig => {
  const merged = { ...defaultConfig, ...(raw || {}) };
  return {
    ...merged,
    activeCouncil: (() => {
      if (
        !Array.isArray(merged.activeCouncil) ||
        merged.activeCouncil.length === 0
      )
        return DEFAULT_COUNCIL;
      // Migrate: update modelId for any member whose ID matches a DEFAULT_COUNCIL member
      const defaultById = Object.fromEntries(
        DEFAULT_COUNCIL.map((m) => [m.id, m])
      );
      return merged.activeCouncil.map((m: any) =>
        defaultById[m.id]
          ? {
              ...m,
              modelId: defaultById[m.id].modelId,
              provider: defaultById[m.id].provider,
            }
          : m
      );
    })(),
    customNodes: Array.isArray(merged.customNodes) ? merged.customNodes : [],
    modelCount: merged.modelCount === 5 ? 5 : 3,
    turnsUsed: Number.isFinite(merged.turnsUsed) ? merged.turnsUsed : 0,
    creditsRemaining: Number.isFinite(merged.creditsRemaining)
      ? merged.creditsRemaining
      : 0,
    totalTurnsAllowed: Number.isFinite(merged.totalTurnsAllowed)
      ? merged.totalTurnsAllowed
      : 2,
    isLifetime: !!merged.isLifetime,
  } as AppConfig;
};

// ─── Types ─────────────────────────────────────────────────────────────────

interface SessionContextValue {
  // Council session state
  session: SessionState;
  setSession: React.Dispatch<React.SetStateAction<SessionState>>;

  // App configuration
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;

  // Session history
  history: SessionState[];
  setHistory: React.Dispatch<React.SetStateAction<SessionState[]>>;

  // Input state
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;

  // UI state
  isPaywallOpen: boolean;
  setIsPaywallOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showOutofCreditsUpsell: boolean;
  setShowOutofCreditsUpsell: React.Dispatch<React.SetStateAction<boolean>>;
  isDebateOpen: boolean;
  setIsDebateOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isInputFocused: boolean;
  setIsInputFocused: React.Dispatch<React.SetStateAction<boolean>>;

  // Session recovery
  recoverySession: SessionState | null;
  setRecoverySession: React.Dispatch<React.SetStateAction<SessionState | null>>;

  // Expanded council cards
  expandedCards: Set<string>;
  setExpandedCards: React.Dispatch<React.SetStateAction<Set<string>>>;

  // Council service ref
  councilService: React.MutableRefObject<UnifiedCouncilService>;

  // Scroll refs
  verdictRef: React.RefObject<HTMLDivElement | null>;
  councilRef: React.RefObject<HTMLDivElement | null>;
  debateChoiceRef: React.RefObject<HTMLDivElement | null>;
  compositionRef: React.RefObject<HTMLDivElement | null>;

  // Handler functions
  startSession: (queryInput: string) => Promise<void>;
  handleStart: (queryOverride?: string) => Promise<void>;
  handleCompose: (composedText: string) => Promise<void>;
  handleQuickCompose: () => Promise<void>;
  runSynthesis: (
    query: string,
    responses: CouncilResponse[],
    debateMsgs: DebateMessage[],
    userComposed?: string
  ) => Promise<void>;
  handleEndDebate: (debateMessages: DebateMessage[]) => Promise<void>;
  handleAddDebateMessage: (msg: DebateMessage) => void;
  handlePurchaseTurns: (count: number) => void;

  // Helpers
  scrollTo: (
    ref: React.RefObject<HTMLDivElement | null>,
    delay?: number
  ) => void;
  toggleCard: (memberId: string) => void;
}

// ─── Context ───────────────────────────────────────────────────────────────

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

// ─── Provider ──────────────────────────────────────────────────────────────

export const SessionProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { authSession, profile, fetchProfile } = useAuth();

  // ── Config ─────────────────────────────────────────────────────────────

  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem("fainl_config_v2");
    if (!saved) return normalizeConfig(null);
    if (saved.length > 100_000) return normalizeConfig(null);
    try {
      return normalizeConfig(JSON.parse(saved));
    } catch {
      return normalizeConfig(null);
    }
  });

  // ── History ────────────────────────────────────────────────────────────

  const [history, setHistory] = useState<SessionState[]>(() => {
    const saved = localStorage.getItem("fainl_history");
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((s: any) => ({
        ...s,
        id: s.id || crypto.randomUUID(),
        isArchived: !!s.isArchived,
      }));
    } catch {
      return [];
    }
  });

  // ── Input ──────────────────────────────────────────────────────────────

  const [input, setInput] = useState("");

  // ── UI state ───────────────────────────────────────────────────────────

  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [showOutofCreditsUpsell, setShowOutofCreditsUpsell] = useState(false);
  const [isDebateOpen, setIsDebateOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // ── Session state ──────────────────────────────────────────────────────

  const [session, setSession] = useState<SessionState>({
    id: crypto.randomUUID(),
    stage: WorkflowStage.IDLE,
    query: "",
    councilResponses: [],
    debateMessages: [],
    reviews: [],
    synthesis: "",
  });

  // ── Recovery session ───────────────────────────────────────────────────

  const [recoverySession, setRecoverySession] =
    useState<SessionState | null>(() => {
      try {
        const saved = localStorage.getItem(SESSION_RECOVERY_KEY);
        if (!saved) return null;
        const parsed: SessionState = JSON.parse(saved);
        // Only offer recovery for sessions that have council responses
        if (
          parsed.councilResponses?.length > 0 &&
          parsed.stage !== WorkflowStage.IDLE
        )
          return parsed;
      } catch {
        /* ignore */
      }
      return null;
    });

  // ── Refs ───────────────────────────────────────────────────────────────

  const councilService = useRef(new UnifiedCouncilService(config));
  const verdictRef = useRef<HTMLDivElement>(null);
  const councilRef = useRef<HTMLDivElement>(null);
  const debateChoiceRef = useRef<HTMLDivElement>(null);
  const compositionRef = useRef<HTMLDivElement>(null);

  // ── Helpers ────────────────────────────────────────────────────────────

  const scrollTo = useCallback(
    (ref: React.RefObject<HTMLDivElement | null>, delay = 80) => {
      setTimeout(
        () => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        delay
      );
    },
    []
  );

  const toggleCard = useCallback((memberId: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  }, []);

  // ── Effects: localStorage persistence ──────────────────────────────────

  useEffect(() => {
    councilService.current = new UnifiedCouncilService(config);
    localStorage.setItem("fainl_config_v2", JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem("fainl_history", JSON.stringify(history));
  }, [history]);

  // Auto-expand all council cards once all responses have arrived
  useEffect(() => {
    if (session.stage === WorkflowStage.DEBATE) {
      setExpandedCards(new Set(config.activeCouncil.map((m) => m.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.stage]);

  // Persist in-progress sessions to localStorage so they survive a page refresh
  useEffect(() => {
    if (
      session.stage === WorkflowStage.IDLE ||
      session.stage === WorkflowStage.COMPLETED
    ) {
      localStorage.removeItem(SESSION_RECOVERY_KEY);
      return;
    }
    const t = setTimeout(() => {
      try {
        localStorage.setItem(SESSION_RECOVERY_KEY, JSON.stringify(session));
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [session]);

  // Payment confirm URL param handling
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment_confirm") === "true") {
      const type = params.get("type");
      const countStr = params.get("count");
      const count =
        countStr === "infinity" ? Infinity : parseInt(countStr || "0", 10);

      if (type === "lifetime") {
        setConfig((prev) => ({ ...prev, isLifetime: true }));
      } else if (type === "credits" || type === "turns") {
        // Both credits and subscription purchases add to creditsRemaining
        setConfig((prev) => ({
          ...prev,
          creditsRemaining:
            prev.creditsRemaining +
            (isFinite(count as number) ? (count as number) : 0),
          isLifetime: count === Infinity ? true : prev.isLifetime,
        }));
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Core session functions ─────────────────────────────────────────────

  const runSynthesis = useCallback(
    async (
      query: string,
      responses: CouncilResponse[],
      debateMsgs: DebateMessage[],
      userComposed?: string
    ) => {
      const readyForSynth = councilService.current.getReadyMembers(
        config.activeCouncil
      );
      const membersForSynth =
        readyForSynth.length > 0 ? readyForSynth : config.activeCouncil;
      setSession((prev) => ({
        ...prev,
        stage: WorkflowStage.SYNTHESIZING,
        synthesis: "",
      }));
      // Scroll verdict into view after a short tick so the DOM has updated
      setTimeout(
        () =>
          verdictRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        80
      );
      try {
        const synthesis = await councilService.current.synthesizeStream(
          query,
          responses,
          [],
          debateMsgs,
          membersForSynth,
          DEFAULT_CHAIRMAN,
          (chunk) => {
            setSession((prev) => ({
              ...prev,
              synthesis: (prev.synthesis || "") + chunk,
            }));
          },
          userComposed
        );
        setSession((prev) => {
          const completedSession = {
            ...prev,
            synthesis,
            stage: WorkflowStage.COMPLETED,
            timestamp: Date.now(),
          };
          setHistory((h) => [completedSession, ...h]);
          return completedSession;
        });

        // Trigger Upsell if that was the last credit (and not on lifetime)
        const isNowZero = profile
          ? profile.credits_remaining === 0
          : config.creditsRemaining === 0;
        const wasLifetime = profile ? profile.is_lifetime : config.isLifetime;
        const wasGreaterThanZeroBefore = profile
          ? profile.credits_remaining + USAGE_LIMITS.CREDITS_PER_TURN > 0
          : config.creditsRemaining + USAGE_LIMITS.CREDITS_PER_TURN > 0;

        if (isNowZero && !wasLifetime && wasGreaterThanZeroBefore) {
          setTimeout(() => setShowOutofCreditsUpsell(true), 3000);
        }
      } catch (err: any) {
        console.error(err);
        setSession((prev) => ({
          ...prev,
          stage: WorkflowStage.ERROR,
          error: err.message || "Synthesis failed.",
        }));
      }
    },
    [config, profile]
  );

  const startSession = useCallback(
    async (queryInput: string) => {
      const allMembers = config.activeCouncil;
      const readyMembers = councilService.current.getReadyMembers(allMembers);
      const membersToUse =
        readyMembers.length > 0 ? readyMembers : allMembers;

      if (membersToUse.length < 1) {
        setSession((prev) => ({
          ...prev,
          stage: WorkflowStage.ERROR,
          error:
            "Geen nodes gevonden. Voeg minimaal één node toe aan je raad.",
        }));
        return;
      }

      // Deduct credit atomically server-side via RPC to prevent race conditions
      if (authSession?.user && profile) {
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "deduct_credit",
          { p_user_id: authSession.user.id }
        );
        if (rpcError || !rpcData?.success) {
          setSession((prev) => ({
            ...prev,
            stage: WorkflowStage.ERROR,
            error: "Onvoldoende credits om een sessie te starten.",
          }));
          return;
        }
        // Note: fetchProfile is available from AuthContext but we update profile
        // locally via the auth context's internal state. Since we can't directly
        // call setProfile here, we rely on the next fetchProfile call or pass the
        // update through. For now we mirror what App.tsx did — but since AuthContext
        // owns profile, the caller should call fetchProfile after credit changes.
        // We'll trigger a profile refresh.
        await fetchProfile(authSession.user.id);
      } else {
        // Fallback local storage for backward compat edge cases
        setConfig((current) => {
          if (current.creditsRemaining > 0) {
            return {
              ...current,
              creditsRemaining:
                current.creditsRemaining - USAGE_LIMITS.CREDITS_PER_TURN,
            };
          } else {
            return {
              ...current,
              turnsUsed: current.turnsUsed + 1,
            };
          }
        });
      }

      setSession({
        id: crypto.randomUUID(),
        stage: WorkflowStage.PROCESSING_COUNCIL,
        query: queryInput,
        councilResponses: [],
        debateMessages: [],
        reviews: [],
        synthesis: "",
      });
      // Scroll to council cards as soon as they appear
      scrollTo(councilRef, 300);

      try {
        const responses =
          await councilService.current.getCouncilResponses(
            queryInput,
            membersToUse
          );

        if (responses.length === 0) {
          setSession((prev) => ({
            ...prev,
            stage: WorkflowStage.ERROR,
            error:
              "Geen van de AI-nodes kon een antwoord genereren. Controleer de API-sleutels of probeer het opnieuw.",
          }));
          return;
        }

        // Stop at DEBATE stage — user chooses: Live Debate or direct Chairman's Verdict
        setSession((prev) => ({
          ...prev,
          councilResponses: responses,
          stage: WorkflowStage.DEBATE,
          synthesis: "",
          debateMessages: [],
        }));
        // Scroll to the choice buttons once all nodes are done
        scrollTo(debateChoiceRef, 150);
      } catch (err: any) {
        console.error(err);
        setSession((prev) => ({
          ...prev,
          stage: WorkflowStage.ERROR,
          error:
            err.message || "Autonomous consensus protocol interrupted.",
        }));
      }
    },
    [config, authSession, profile, fetchProfile, scrollTo]
  );

  const handleStart = useCallback(
    async (queryOverride?: string) => {
      const queryToUse = queryOverride ?? input;
      if (!queryToUse.trim()) return;

      const currentCredits = profile
        ? profile.credits_remaining
        : config.creditsRemaining;
      const currentTurns = profile
        ? profile.total_turns_used
        : config.turnsUsed;
      const isLifetime = profile ? profile.is_lifetime : config.isLifetime;

      const hasCredits = currentCredits > 0;
      const hasTurnsRemaining = currentTurns < config.totalTurnsAllowed;
      const isAllowed = isLifetime || hasTurnsRemaining || hasCredits;

      if (!isAllowed) {
        // After 2 free anonymous turns, force login/registration
        setIsPaywallOpen(true);
        return;
      }

      await startSession(queryToUse);
    },
    [input, config, profile, startSession]
  );

  const handleCompose = useCallback(
    async (composedText: string) => {
      setSession((prev) => ({
        ...prev,
        userComposedResponse: composedText,
        stage: WorkflowStage.SYNTHESIZING,
      }));
      // Use current session values via a ref-like pattern:
      // We read from the session state at call time.
      // Note: session is stale in the closure, so we read the latest via
      // the functional updater trick — but runSynthesis needs the values,
      // not setState. We solve this by capturing the values before the call.
      setSession((prev) => {
        // Kick off synthesis with the current session values
        runSynthesis(
          prev.query,
          prev.councilResponses,
          prev.debateMessages,
          composedText
        );
        return {
          ...prev,
          userComposedResponse: composedText,
          stage: WorkflowStage.SYNTHESIZING,
        };
      });
    },
    [runSynthesis]
  );

  const handleQuickCompose = useCallback(async () => {
    const CATS = ["STANDPUNT", "ANALYSE", "NUANCE", "ADVIES"];
    setSession((prev) => {
      const allText = prev.councilResponses
        .flatMap((r) => CATS.map((cat) => r.sections?.[cat]).filter(Boolean))
        .join("\n\n");
      const composedText =
        allText || prev.councilResponses.map((r) => r.content).join("\n\n");
      runSynthesis(
        prev.query,
        prev.councilResponses,
        prev.debateMessages,
        composedText
      );
      return {
        ...prev,
        userComposedResponse: composedText,
        stage: WorkflowStage.SYNTHESIZING,
      };
    });
  }, [runSynthesis]);

  const handleEndDebate = useCallback(
    async (debateMessages: DebateMessage[]) => {
      setIsDebateOpen(false);
      setSession((prev) => ({
        ...prev,
        debateMessages,
        stage: WorkflowStage.COMPOSITION,
      }));
      scrollTo(compositionRef, 200);
    },
    [scrollTo]
  );

  const handleAddDebateMessage = useCallback((msg: DebateMessage) => {
    setSession((prev) => ({
      ...prev,
      debateMessages: [...prev.debateMessages, msg],
    }));
  }, []);

  const handlePurchaseTurns = useCallback((count: number) => {
    const creditPkg = PRICING.CREDITS.find((p) => p.count === count);
    const subPkg = PRICING.SUBSCRIPTIONS.find(
      (p) => p.count === count || p.creditsPerMonth === count
    );
    const pkg = creditPkg || subPkg;
    if (!pkg?.stripeUrl) {
      alert("Deze betaallink is nog niet actief.");
      return;
    }
    // Stripe Payment Links do not support ?success_url= overrides.
    // Configure each Payment Link's success URL in the Stripe Dashboard to:
    //   https://fainl.com/?payment_confirm=true&type=credits&count=X
    try {
      const destination = new URL(pkg.stripeUrl);
      if (!destination.hostname.endsWith("stripe.com"))
        throw new Error("invalid host");
    } catch {
      alert("Ongeldige betaallink. Neem contact op met support.");
      return;
    }
    window.location.href = pkg.stripeUrl;
  }, []);

  // ── Context value ──────────────────────────────────────────────────────

  const value: SessionContextValue = {
    // State
    session,
    setSession,
    config,
    setConfig,
    history,
    setHistory,
    input,
    setInput,
    isPaywallOpen,
    setIsPaywallOpen,
    showOutofCreditsUpsell,
    setShowOutofCreditsUpsell,
    isDebateOpen,
    setIsDebateOpen,
    isInputFocused,
    setIsInputFocused,
    recoverySession,
    setRecoverySession,
    expandedCards,
    setExpandedCards,

    // Refs
    councilService,
    verdictRef,
    councilRef,
    debateChoiceRef,
    compositionRef,

    // Handlers
    startSession,
    handleStart,
    handleCompose,
    handleQuickCompose,
    runSynthesis,
    handleEndDebate,
    handleAddDebateMessage,
    handlePurchaseTurns,

    // Helpers
    scrollTo,
    toggleCard,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

// ─── Hook ──────────────────────────────────────────────────────────────────

export const useSession = (): SessionContextValue => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
