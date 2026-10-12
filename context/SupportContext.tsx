"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ComponentType,
  type ReactNode,
} from "react";

export type SupportTab = "issue" | "feedback";

type SupportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: SupportTab;
};

type SupportContextType = {
  isOpen: boolean;
  openSupport: (tab?: SupportTab) => void;
  closeSupport: () => void;
};

const SupportContext = createContext<SupportContextType | null>(null);

export function useSupport() {
  const ctx = useContext(SupportContext);
  if (!ctx) {
    throw new Error("useSupport must be used within a SupportProvider");
  }
  return ctx;
}

/**
 * Provides openSupport/closeSupport. The modal is loaded only after mount
 * when opened, so SSR and the first client render stay identical (children only).
 */
export function SupportProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<SupportTab>("issue");
  const [Modal, setModal] = useState<ComponentType<SupportModalProps> | null>(
    null
  );

  const openSupport = useCallback((tab: SupportTab = "issue") => {
    setDefaultTab(tab);
    setIsOpen(true);
  }, []);

  const closeSupport = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen || Modal) {
      return;
    }

    const state = { cancelled: false };

    void import("@/components/support/SupportFeedbackModal").then((mod) => {
      if (!state.cancelled) {
        setModal(() => mod.SupportFeedbackModal);
      }
    });

    return () => {
      state.cancelled = true;
    };
  }, [isOpen, Modal]);

  return (
    <SupportContext.Provider value={{ isOpen, openSupport, closeSupport }}>
      {children}
      {Modal ? (
        <Modal isOpen={isOpen} onClose={closeSupport} defaultTab={defaultTab} />
      ) : null}
    </SupportContext.Provider>
  );
}
