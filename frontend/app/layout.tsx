import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { CollaborationProvider } from "@/contexts/collaboration-context";
import { AIInsightsProvider } from "@/contexts/ai-insights-context";
import { SecurityProvider } from "@/contexts/security-context";
import { WebSocketProvider } from "@/contexts/websocket-context";
import { Providers } from "@/components/providers";
import { ToastProvider } from "@/components/ui";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: {
    default: "OpenAssess",
    template: "%s | OpenAssess",
  },
  description: "AI-powered continuous assessment for learning, analytics, proctoring, and verified certificates.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head>
      </head>
      <body className="min-h-screen" suppressHydrationWarning>
        <Providers>
            <ThemeProvider>
              <CollaborationProvider>
                <AIInsightsProvider>
                  <SecurityProvider>
                    <WebSocketProvider>
                      <AuthProvider>
                        <ToastProvider>{children}</ToastProvider>
                      </AuthProvider>
                    </WebSocketProvider>
                  </SecurityProvider>
                </AIInsightsProvider>
              </CollaborationProvider>
            </ThemeProvider>
          </Providers>
      </body>
    </html>
  );
}
