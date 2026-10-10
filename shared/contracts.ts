export type Language = "ru" | "en" | "zh";
export type NotificationKind = "danger" | "team" | "timer" | "system";

export interface ConnectionState {
  status: "disconnected" | "connecting" | "connected" | "error";
  serverId: string | null;
  error: string | null;
  lastSync: number | null;
}
export interface ServerSummary {
  id: string;
  name: string;
  ip: string;
  port: number;
  playerId: string;
}
export interface Device {
  id: string;
  serverId: string;
  entityId: number;
  name: string;
  type: number;
  payload?: {
    value?: boolean;
    capacity?: number;
    protectionExpiry?: number;
    items?: Array<{ itemId: number; quantity: number }>;
  };
  error?: string;
}
export interface RelayEvent {
  id: string;
  title: string;
  detail: string;
  kind: string;
  time: number;
}
export interface Timer {
  id: string;
  name: string;
  grid: string;
  ends: number;
  grade: string;
}
export interface MapRoute {
  id: string;
  serverId: string;
  serverName: string;
  playerId: string;
  mapKey: string;
  started: number;
  ended: number | null;
  distance: number;
  points: Array<{ x: number; y: number; time: number }>;
}
export interface Pin {
  id: string;
  serverId: string | null;
  name: string;
  x: number;
  y: number;
  kind?: "pin" | "base" | "favorite";
}
export interface RelaySettings {
  language: Language;
  motion: boolean;
  glass: boolean;
  notifications: boolean;
  overlayNotifications: boolean;
  notificationKinds: Record<NotificationKind, boolean>;
  autoStart: boolean;
  closeToTray: boolean;
  bot: boolean;
  discord: boolean;
  hasWebhook?: boolean;
}
export interface SignInState {
  host: string;
  loading: boolean;
  error: string | null;
  canGoBack: boolean;
}
export interface AppState {
  companion: CompanionState | null;
  signIn: SignInState | null;
  connection: ConnectionState;
  servers: ServerSummary[];
  devices: Device[];
  events: RelayEvent[];
  timers: Timer[];
  pins: Pin[];
  routes: MapRoute[];
  tracking: boolean;
  account: { steamId: string } | null;
  requiresSignIn: boolean;
  settings: RelaySettings;
  info: {
    name: string;
    players: number;
    maxPlayers: number;
    queuedPlayers: number;
    mapSize: number;
    wipeTime: number;
    seed?: number;
    map?: string;
  } | null;
  heatmap: {
    resolution: number;
    worldSize: number;
    categories: Record<string, string>;
    elevation?: {
      resolution: number;
      values: string;
      min: number;
      max: number;
    };
  } | null;
  heatmapStatus: "idle" | "loading" | "ready" | "unavailable" | "error";
  map: {
    jpgImage: string;
    width: number;
    height: number;
    oceanMargin: number;
    monuments: Array<{ token: string; x: number; y: number }>;
  } | null;
  time: { time: number; sunrise: number; sunset: number } | null;
  team: Array<{
    steamId: string;
    name: string;
    isOnline: boolean;
    isAlive: boolean;
    x: number;
    y: number;
  }>;
  mapNotes: Array<{ type: number; x: number; y: number }>;
  chat: Array<{ steamId: string; name: string; message: string; time: number }>;
  census: Array<{
    kind: string;
    x: number;
    y: number;
    serverId: string | null;
  }>;
  pairStatus: string;
  pairError: string | null;
  hasPairing: boolean;
}
export const emptyState: AppState = {
  companion: null,
  signIn: null,
  connection: {
    status: "disconnected",
    serverId: null,
    error: null,
    lastSync: null,
  },
  servers: [],
  devices: [],
  events: [],
  timers: [],
  pins: [],
  routes: [],
  tracking: false,
  account: null,
  requiresSignIn: false,
  census: [],
  settings: {
    language: "en",
    motion: true,
    glass: true,
    notifications: true,
    overlayNotifications: true,
    notificationKinds: {
      danger: true,
      team: true,
      timer: true,
      system: true,
    },
    autoStart: false,
    closeToTray: true,
    bot: false,
    discord: false,
  },
  info: null,
  map: null,
  heatmap: null,
  heatmapStatus: "idle",
  time: null,
  team: [],
  chat: [],
  mapNotes: [],
  pairStatus: "idle",
  pairError: null,
  hasPairing: false,
};
declare global {
  interface Window {
    relay?: {
      invoke: (action: string, payload?: unknown) => Promise<any>;
      subscribe: (listener: (state: AppState) => void) => () => void;
    };
  }
}

export interface CompanionState {
  general: Record<string, string | number | boolean>;
  aliases: Array<{ alias: string; value: string }>;
  blacklist: { discordIds: string[]; steamIds: string[] };
  server: {
    notes: Record<string, string>;
    markers: Record<string, { x: number; y: number; location: string }>;
    switchGroups: Record<
      string,
      { name: string; command: string; switches: string[] }
    >;
    switches: Record<
      string,
      { name: string; command: string; autoDayNightOnOff: number }
    >;
  } | null;
  log: Array<{ time: number; level: string; title: string }>;
  commands: Array<{ name: string; description: string; example?: string }>;
  tools: CompanionTool[];
}

export interface CompanionTool {
  name: string;
  description: string;
  options?: CompanionOption[];
}
export interface CompanionOption {
  name: string;
  description: string;
  type: number;
  required?: boolean;
  choices?: Array<{ name: string; value: string | number }>;
  options?: CompanionOption[];
}
