import { useState, useCallback, useEffect } from "react";

const SESSION_STORAGE_KEY = 'sf-security-session-id';

export interface ScanSession {
  id: string;
  startedAt: string;
  domain?: string;
}

// Generate a UUID without external dependency
function generateSessionId(): string {
  return crypto.randomUUID();
}

export function useScanSession() {
  const [currentSession, setCurrentSession] = useState<ScanSession | null>(() => {
    // Try to restore from sessionStorage (not localStorage - we want fresh sessions per browser tab)
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Persist session to sessionStorage
  useEffect(() => {
    if (currentSession) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentSession));
    }
  }, [currentSession]);

  const startNewSession = useCallback((domain?: string): ScanSession => {
    const newSession: ScanSession = {
      id: generateSessionId(),
      startedAt: new Date().toISOString(),
      domain,
    };
    setCurrentSession(newSession);
    return newSession;
  }, []);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setCurrentSession(null);
  }, []);

  const getSessionId = useCallback((): string | null => {
    return currentSession?.id ?? null;
  }, [currentSession]);

  return {
    currentSession,
    sessionId: currentSession?.id ?? null,
    startNewSession,
    clearSession,
    getSessionId,
    hasActiveSession: !!currentSession,
  };
}
