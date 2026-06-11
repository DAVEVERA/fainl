export enum ModelProvider {
  GOOGLE = "Google (Direct)",
  OPENAI = "OpenAI",
  ANTHROPIC = "Anthropic",
  GROQ = "Groq",
  DEEPSEEK = "DeepSeek",
  MISTRAL = "Mistral AI",
  OPENROUTER = "OpenRouter",
  OLLAMA = "Ollama (Local)",
  CUSTOM = "Custom (OpenAI Compatible)",
  MIMO = "MiMo-V2-Flash",
  DEVSTRAL = "Devstral 2 2512",
  KAT = "KAT-Coder-Pro V1",
  OLMO = "Olmo 3 32B Think",
  NEMOTRON = "Nemotron 3 Nano",
  GEMMA = "Gemma 3 12B",
  GLM = "GLM 4.5 Air",
}

export interface CouncilMember {
  id: string;
  name: string;
  role: string;
  provider: ModelProvider;
  modelId: string; // The API model string
  baseUrl?: string; // For custom endpoints (Groq, LocalAI)
  avatar: string;
  color: string; // Tailwind class
  description: string;
  systemPrompt?: string; // Custom instructions for this specific member
}

export interface PeerReview {
  reviewerId: string;
  targetId: string;
  content: string;
  score: number; // 1-10
}

export interface CouncilResponse {
  memberId: string;
  content: string; // Raw content
  sections?: Record<string, string>; // Parsed compartments
  timestamp: number;
}

export interface DebateMessage {
  id: string;
  memberId: string;
  content: string;
  timestamp: number;
}

export enum WorkflowStage {
  IDLE = "IDLE",
  PROCESSING_COUNCIL = "PROCESSING_COUNCIL",
  DEBATE = 'DEBATE',
  COMPOSITION = "COMPOSITION",
  PEER_REVIEW = "PEER_REVIEW",
  SYNTHESIZING = "SYNTHESIZING",
  COMPLETED = "COMPLETED",
  ERROR = "ERROR",
}

export interface SessionState {
  id: string;
  stage: WorkflowStage;
  query: string;
  councilResponses: CouncilResponse[];
  debateMessages: DebateMessage[];
  reviews: PeerReview[];
  userComposedResponse?: string; // The "7th node" / 4th node custom choice
  synthesis: string;
  error?: string;
  isArchived?: boolean;
  timestamp?: number;
}

export interface AppConfig {
  activeCouncil: CouncilMember[];
  customNodes: CouncilMember[];
  chairmanId: string;
  modelCount: 3 | 5;
  // Usage Tracking
  turnsUsed: number;
  creditsRemaining: number;
  isLifetime: boolean;
  totalTurnsAllowed: number;
  // Local/custom provider keys (proxied providers use server-side secrets)
  customKey?: string;
  customBaseUrl?: string;
  // Legacy key fields kept for backwards-compat with saved localStorage configs
  googleKey?: string;
  openaiKey?: string;
  anthropicKey?: string;
  groqKey?: string;
  deepseekKey?: string;
  mistralKey?: string;
  openRouterKey?: string;
  nemotronKey?: string;
  glmKey?: string;
  mimoKey?: string;
  devstralKey?: string;
  katKey?: string;
  olmoKey?: string;
  gemmaKey?: string;
}
