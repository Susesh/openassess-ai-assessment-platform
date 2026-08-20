"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Bug, Zap, Shield, Activity } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  enableAutoRecovery?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRecovering: boolean;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeouts: Map<number, NodeJS.Timeout> = new Map();
  private static errorHistory: Array<{ error: Error; timestamp: number; context: string }> = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Add to error history for analytics
    ErrorBoundary.errorHistory.push({
      error,
      timestamp: Date.now(),
      context: window.location.pathname,
    });

    // Keep only last 50 errors
    if (ErrorBoundary.errorHistory.length > 50) {
      ErrorBoundary.errorHistory.shift();
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Error Info:', errorInfo);
      console.error('Error History:', ErrorBoundary.errorHistory);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to error reporting service (in production)
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }

    // Attempt automatic recovery if enabled
    if (this.props.enableAutoRecovery && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.attemptAutoRecovery();
    }
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    const errorData = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount,
      errorHistory: ErrorBoundary.errorHistory.slice(-5),
    };

    // Send to error tracking service
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
    }).catch(console.error);

    console.error('Error logged to service:', errorData);
  }

  private attemptAutoRecovery = () => {
    this.setState({ isRecovering: true });
    
    const retryDelay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000); // Exponential backoff
    
    const timeoutId = setTimeout(() => {
      this.setState({ 
        isRecovering: false,
        retryCount: this.state.retryCount + 1,
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }, retryDelay);
    
    this.retryTimeouts.set(this.state.retryCount, timeoutId);
  };

  private handleReset = () => {
    // Clear any pending recovery timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false,
    });
  };

  private handleRetry = () => {
    this.setState({ 
      retryCount: this.state.retryCount + 1,
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private getErrorSeverity = (): 'low' | 'medium' | 'high' => {
    if (!this.state.error) return 'low';
    
    const errorPatterns = {
      high: ['network', 'fetch', 'timeout', 'critical', 'security'],
      medium: ['render', 'component', 'state', 'prop'],
      low: ['warning', 'deprecated', 'console'],
    };

    const errorMessage = this.state.error.message.toLowerCase();
    
    for (const [severity, patterns] of Object.entries(errorPatterns)) {
      if (patterns.some(pattern => errorMessage.includes(pattern))) {
        return severity as 'low' | 'medium' | 'high';
      }
    }
    
    return 'medium';
  };

  componentWillUnmount() {
    // Clear all pending timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const severity = this.getErrorSeverity();
      const severityColors = {
        low: 'bg-amber-50 border-amber-200 text-amber-700',
        medium: 'bg-orange-50 border-orange-200 text-orange-700',
        high: 'bg-red-50 border-red-200 text-red-700',
      };

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F6F7] p-4">
          <div className="max-w-md w-full">
            <div className="rounded-[24px] border border-[#C1C4C8] bg-white p-8 shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-full ${severityColors[severity].split(' ')[0]} flex items-center justify-center mb-6`}>
                  <AlertTriangle className={`w-8 h-8 ${severityColors[severity].split(' ')[2]}`} />
                </div>
                
                <h1 className="text-2xl font-bold text-[#2B2E33] mb-2">
                  Something went wrong
                </h1>
                
                <p className="text-[#7B7F85] mb-6">
                  We encountered an unexpected error. This has been logged and our team will look into it.
                </p>

                {/* Error Severity Badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${severityColors[severity]} mb-4`}>
                  <Shield className="w-3 h-3" />
                  {severity.toUpperCase()} SEVERITY
                  {this.state.errorId && <span className="opacity-60">· {this.state.errorId}</span>}
                </div>

                {/* Auto Recovery Indicator */}
                {this.state.isRecovering && (
                  <div className="flex items-center gap-2 text-sm text-[#7B7F85] mb-4">
                    <Zap className="w-4 h-4 animate-pulse" />
                    <span>Attempting automatic recovery...</span>
                  </div>
                )}

                {/* Error Analytics */}
                <div className="grid grid-cols-2 gap-3 mb-6 w-full">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-[#F5F6F7]">
                    <Activity className="w-4 h-4 text-[#2B2E33]" />
                    <div className="text-left">
                      <p className="text-xs text-[#7B7F85]">Retry Count</p>
                      <p className="text-sm font-semibold text-[#2B2E33]">{this.state.retryCount}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-[#F5F6F7]">
                    <Bug className="w-4 h-4 text-[#2B2E33]" />
                    <div className="text-left">
                      <p className="text-xs text-[#7B7F85]">Error History</p>
                      <p className="text-sm font-semibold text-[#2B2E33]">{ErrorBoundary.errorHistory.length}</p>
                    </div>
                  </div>
                </div>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="w-full text-left mb-6">
                    <summary className="cursor-pointer text-sm font-semibold text-[#2B2E33] mb-2 hover:text-[#7B7F85]">
                      Error Details
                    </summary>
                    <div className="bg-[#F5F6F7] rounded-lg p-4 text-xs font-mono text-[#7B7F85] overflow-auto max-h-40">
                      <p className="font-semibold text-red-600 mb-1">{this.state.error.message}</p>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                      {this.state.errorInfo && (
                        <pre className="mt-2 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                      )}
                    </div>
                  </details>
                )}

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    onClick={this.handleRetry}
                    disabled={this.state.isRecovering}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#2B2E33] text-white rounded-xl font-semibold hover:bg-[#7B7F85] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 ${this.state.isRecovering ? 'animate-spin' : ''}`} />
                    {this.state.isRecovering ? 'Recovering...' : 'Retry'}
                  </button>
                  
                  <button
                    onClick={this.handleReset}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-[#C1C4C8] text-[#2B2E33] rounded-xl font-semibold hover:bg-[#F5F6F7] transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    Reset
                  </button>
                  
                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-[#C1C4C8] text-[#2B2E33] rounded-xl font-semibold hover:bg-[#F5F6F7] transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    Home
                  </button>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Error ID: ${this.state.errorId}\nError: ${this.state.error?.message}\n\nStack: ${this.state.error?.stack}\n\nComponent Stack: ${this.state.errorInfo?.componentStack}\n\nRetry Count: ${this.state.retryCount}\nError History: ${ErrorBoundary.errorHistory.length}`
                    );
                  }}
                  className="mt-4 flex items-center gap-2 text-sm text-[#7B7F85] hover:text-[#2B2E33] transition-colors"
                >
                  <Bug className="w-4 h-4" />
                  Copy Error Details
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
