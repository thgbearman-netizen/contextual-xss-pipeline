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
  const [currentSession, setCurrentSession] = useState<ScanSession | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Restore from sessionStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentSession(parsed);
      }
    } catch (error) {
      console.warn('Failed to restore session from storage:', error);
    }
    setIsInitialized(true);
  }, []);

  // Persist session to sessionStorage when it changes
  useEffect(() => {
    if (!isInitialized) return;
    
    if (currentSession) {
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentSession));
      } catch (error) {
        console.warn('Failed to save session to storage:', error);
      }
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [currentSession, isInitialized]);

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
    isInitialized,
  };
}
