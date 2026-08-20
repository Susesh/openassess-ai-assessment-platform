"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SecurityContextType {
  securityLevel: 'low' | 'medium' | 'high';
  mfaEnabled: boolean;
  sessionTimeout: number;
  lastActivity: number;
  setSecurityLevel: (level: 'low' | 'medium' | 'high') => void;
  toggleMFA: () => void;
  updateActivity: () => void;
  checkSessionExpiry: () => boolean;
  securityEvents: SecurityEvent[];
  addSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => void;
}

interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'mfa_enabled' | 'mfa_disabled' | 'password_change' | 'suspicious_activity';
  timestamp: number;
  details: string;
  severity: 'low' | 'medium' | 'high';
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: ReactNode }) {
  const [securityLevel, setSecurityLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30 * 60 * 1000); // 30 minutes
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);

  useEffect(() => {
    // Load security settings from localStorage
    const savedSecurityLevel = localStorage.getItem('securityLevel') as 'low' | 'medium' | 'high';
    const savedMfaEnabled = localStorage.getItem('mfaEnabled') === 'true';
    
    if (savedSecurityLevel) setSecurityLevel(savedSecurityLevel);
    if (savedMfaEnabled !== null) setMfaEnabled(savedMfaEnabled);

    // Load security events
    const savedEvents = localStorage.getItem('securityEvents');
    if (savedEvents) {
      try {
        setSecurityEvents(JSON.parse(savedEvents));
      } catch (e) {
        console.error('Failed to parse security events:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Save security settings to localStorage
    localStorage.setItem('securityLevel', securityLevel);
    localStorage.setItem('mfaEnabled', mfaEnabled.toString());
    localStorage.setItem('securityEvents', JSON.stringify(securityEvents));
  }, [securityLevel, mfaEnabled, securityEvents]);

  useEffect(() => {
    // Activity tracking
    const handleActivity = () => updateActivity();
    
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, []);

  const updateActivity = () => {
    setLastActivity(Date.now());
  };

  const checkSessionExpiry = () => {
    const elapsed = Date.now() - lastActivity;
    return elapsed > sessionTimeout;
  };

  const toggleMFA = () => {
    const newState = !mfaEnabled;
    setMfaEnabled(newState);
    addSecurityEvent({
      type: newState ? 'mfa_enabled' : 'mfa_disabled',
      details: `Multi-factor authentication ${newState ? 'enabled' : 'disabled'}`,
      severity: 'medium',
    });
  };

  const addSecurityEvent = (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => {
    const newEvent: SecurityEvent = {
      ...event,
      id: `SEC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    
    setSecurityEvents(prev => {
      const updated = [newEvent, ...prev].slice(0, 100); // Keep last 100 events
      return updated;
    });
  };

  return (
    <SecurityContext.Provider
      value={{
        securityLevel,
        mfaEnabled,
        sessionTimeout,
        lastActivity,
        setSecurityLevel,
        toggleMFA,
        updateActivity,
        checkSessionExpiry,
        securityEvents,
        addSecurityEvent,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
