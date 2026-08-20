"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { getToken } from "@/lib/auth";

interface WebSocketContextType {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  sendMessage: (message: any) => void;
  subscribe: (event: string, callback: (data: any) => void) => () => void;
  presence: Map<string, { name: string; color: string; lastSeen: number }>;
  myPresence: { name: string; color: string } | null;
  setMyPresence: (presence: { name: string; color: string }) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketMessage {
  type: string;
  data: any;
  sender?: string;
  timestamp: number | null;
}

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [presence, setPresence] = useState<Map<string, { name: string; color: string; lastSeen: number }>>(new Map());
  const [myPresence, setMyPresence] = useState<{ name: string; color: string } | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const subscribersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    
    try {
      const token = getToken();
      const configuredBaseUrl = process.env.NEXT_PUBLIC_WS_URL?.trim();
      const browserHost = typeof window !== "undefined" ? window.location.host : "localhost:3000";
      
      // In development, connect directly to backend WebSocket
      // In production, use configured URL or same host
      let wsBaseUrl: string;
      if (configuredBaseUrl) {
        wsBaseUrl = configuredBaseUrl;
      } else if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
        // Development: connect to backend WebSocket
        wsBaseUrl = "ws://localhost:8000/ws/";
      } else {
        // Production: use same host as frontend
        wsBaseUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${browserHost}/ws/`;
      }
      
      const wsUrl = token ? `${wsBaseUrl}?token=${token}` : wsBaseUrl;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        
        // Send presence update
        if (myPresence) {
          ws.send(JSON.stringify({
            type: 'presence_update',
            data: myPresence,
          }));
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Handle presence list on initial connection
          if (message.type === 'presence_list') {
            setPresence(new Map(Object.entries(message.data).map(([key, value]: [string, any]) => [
              key,
              { ...value, lastSeen: Date.now() }
            ])));
          }
          
          // Handle presence updates
          if (message.type === 'presence_update') {
            setPresence(prev => {
              const newPresence = new Map(prev);
              newPresence.set(message.sender || 'unknown', {
                ...message.data,
                lastSeen: Date.now(),
              });
              return newPresence;
            });
          }
          
          if (message.type === 'presence_leave') {
            setPresence(prev => {
              const newPresence = new Map(prev);
              newPresence.delete(message.sender || 'unknown');
              return newPresence;
            });
          }
          
          // Notify subscribers
          const subscribers = subscribersRef.current.get(message.type);
          if (subscribers) {
            subscribers.forEach(callback => callback(message.data));
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        setConnectionStatus('error');
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
    }
  }, [myPresence]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }, []);

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (!subscribersRef.current.has(event)) {
      subscribersRef.current.set(event, new Set());
    }
    
    subscribersRef.current.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const subscribers = subscribersRef.current.get(event);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          subscribersRef.current.delete(event);
        }
      }
    };
  }, []);

  // Initialize WebSocket connection - only on dashboard
  useEffect(() => {
    // Only connect WebSocket on dashboard pages
    if (typeof window === 'undefined' || !window.location.pathname.includes('/dashboard')) {
      return;
    }
    
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Update presence when myPresence changes
  useEffect(() => {
    if (isConnected && myPresence) {
      sendMessage({
        type: 'presence_update',
        data: myPresence,
      });
    }
  }, [myPresence, isConnected, sendMessage]);

  // Clean up stale presence
  useEffect(() => {
    const interval = setInterval(() => {
      setPresence(prev => {
        const newPresence = new Map();
        const now = Date.now();
        const staleThreshold = 60000; // 1 minute
        
        prev.forEach((value, key) => {
          if (now - value.lastSeen < staleThreshold) {
            newPresence.set(key, value);
          }
        });
        
        return newPresence;
      });
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        connectionStatus,
        sendMessage,
        subscribe,
        presence,
        myPresence,
        setMyPresence,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

// Hook for subscribing to specific events
export function useWebSocketEvent(event: string, callback: (data: any) => void) {
  const { subscribe } = useWebSocket();
  
  useEffect(() => {
    return subscribe(event, callback);
  }, [event, callback, subscribe]);
}
