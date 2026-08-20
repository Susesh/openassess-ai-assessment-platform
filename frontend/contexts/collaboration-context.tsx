"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

interface Cursor {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
}

interface Presence {
  userId: string;
  userName: string;
  status: "online" | "away" | "offline";
  lastSeen: Date;
  currentPage: string;
}

interface CollaborationState {
  cursors: Map<string, Cursor>;
  presence: Map<string, Presence>;
  isConnected: boolean;
  myUserId: string;
}

interface CollaborationContextType {
  cursors: Cursor[];
  presence: Presence[];
  isConnected: boolean;
  updateCursor: (x: number, y: number) => void;
  updatePresence: (status: "online" | "away" | "offline", currentPage: string) => void;
  broadcastAction: (action: any) => void;
  onAction: (callback: (action: any) => void) => () => void;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export function CollaborationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CollaborationState>({
    cursors: new Map(),
    presence: new Map(),
    isConnected: false,
    myUserId: `user-${Math.random().toString(36).substr(2, 9)}`,
  });

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [actionCallbacks] = useState<Set<(action: any) => void>>(new Set());

  // Generate consistent color for user
  const getUserColor = useCallback((userId: string) => {
    const colors = [
      "#EF4444", "#F97316", "#F59E0B", "#84CC16", "#10B981",
      "#06B6D4", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899"
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }, []);

  // Initialize WebSocket connection - only on dashboard
  useEffect(() => {
    // Only enable collaboration features on dashboard pages
    if (typeof window === 'undefined' || !window.location.pathname.includes('/dashboard')) {
      return;
    }
    
    // In production, connect to actual WebSocket server
    // For now, simulate connection
    const simulateConnection = () => {
      setState(prev => ({ ...prev, isConnected: true }));
      
      // Simulate receiving presence updates
      const interval = setInterval(() => {
        // Simulate other users' cursors
        setState(prev => {
          const newCursors = new Map(prev.cursors);
          // Add simulated cursors for demo
          if (Math.random() > 0.7) {
            newCursors.set(`user-${Math.random().toString(36).substr(2, 9)}`, {
              userId: `user-${Math.random().toString(36).substr(2, 9)}`,
              userName: `User ${Math.floor(Math.random() * 100)}`,
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              color: getUserColor(`user-${Math.random().toString(36).substr(2, 9)}`),
            });
          }
          return { ...prev, cursors: newCursors };
        });
      }, 5000); // Reduced from 3000ms to 5000ms

      return () => clearInterval(interval);
    };

    const timeout = setTimeout(simulateConnection, 1000);
    return () => clearTimeout(timeout);
  }, [getUserColor]);

  // Update cursor position
  const updateCursor = useCallback((x: number, y: number) => {
    setState(prev => {
      const newCursors = new Map(prev.cursors);
      newCursors.set(prev.myUserId, {
        userId: prev.myUserId,
        userName: "You",
        x,
        y,
        color: getUserColor(prev.myUserId),
      });
      return { ...prev, cursors: newCursors };
    });

    // Broadcast to other users via WebSocket
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "cursor_update",
        userId: state.myUserId,
        x,
        y,
      }));
    }
  }, [state.myUserId, getUserColor, socket]);

  // Update presence
  const updatePresence = useCallback((status: "online" | "away" | "offline", currentPage: string) => {
    setState(prev => {
      const newPresence = new Map(prev.presence);
      newPresence.set(prev.myUserId, {
        userId: prev.myUserId,
        userName: "You",
        status,
        lastSeen: new Date(),
        currentPage,
      });
      return { ...prev, presence: newPresence };
    });

    // Broadcast to other users via WebSocket
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "presence_update",
        userId: state.myUserId,
        status,
        currentPage,
      }));
    }
  }, [state.myUserId, socket]);

  // Broadcast action to other users
  const broadcastAction = useCallback((action: any) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "action",
        userId: state.myUserId,
        action,
      }));
    }
  }, [state.myUserId, socket]);

  // Register action callback
  const onAction = useCallback((callback: (action: any) => void) => {
    actionCallbacks.add(callback);
    return () => {
      actionCallbacks.delete(callback);
    };
  }, [actionCallbacks]);

  // Track cursor movement - only on dashboard
  useEffect(() => {
    // Only track cursor on dashboard pages
    if (typeof window === 'undefined' || !window.location.pathname.includes('/dashboard')) {
      return;
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      updateCursor(e.clientX, e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [updateCursor]);

  // Update presence on page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      const status = document.hidden ? "away" : "online";
      updatePresence(status, window.location.pathname);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [updatePresence]);

  // Clean up old cursors
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const newCursors = new Map(prev.cursors);
        const now = Date.now();
        // Remove cursors older than 10 seconds
        for (const [userId, cursor] of newCursors) {
          if (userId !== prev.myUserId && now - (cursor as any).lastUpdate > 10000) {
            newCursors.delete(userId);
          }
        }
        return { ...prev, cursors: newCursors };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [state.myUserId]);

  const value: CollaborationContextType = {
    cursors: Array.from(state.cursors.values()),
    presence: Array.from(state.presence.values()),
    isConnected: state.isConnected,
    updateCursor,
    updatePresence,
    broadcastAction,
    onAction,
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error("useCollaboration must be used within a CollaborationProvider");
  }
  return context;
}
