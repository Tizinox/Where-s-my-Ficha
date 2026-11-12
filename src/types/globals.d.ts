export {};

declare global {
  interface Window {
    Alpine?: any;
    lucideIcons?: Record<string, unknown>;
    lucide?: {
      icons?: Record<string, unknown>;
      createIcons?: (options?: { root?: ParentNode }) => unknown;
    };
    globalTextFormatter?: {
      init?: () => void;
      syncAllEditorsToTextareas?: () => void;
    };
    settingsInteractiveGrid?: {
      init: () => void;
      updateMetrics: () => void;
      wakeUp: () => void;
      sleep: () => void;
      draw: () => void;
    };
    settingsMagneticRail?: {
      init: () => void;
      setActive: (tab: string, animate?: boolean) => void;
    };
    retriggerBiosBoot?: () => void;
    __NEEDS_FACTORY_RESET__?: boolean;
    _blobUrlCache?: Map<string, string>;
    _hotkeysInitialized?: boolean;
  }
}

