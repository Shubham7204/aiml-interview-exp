import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { PHProvider } from "./providers"
import { Suspense } from 'react'
import { PostHogPageview } from "./posthog-pageview"

export const metadata: Metadata = {
  title: "AIML Placement Experiences",
  description: "Placement experiences shared by AIML students",
  generator: 'v0.dev',
  icons: {
    icon: '/favicon.ico',
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Suspense>
        <PostHogPageview />
      </Suspense>
      <body suppressHydrationWarning>
        <PHProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </PHProvider>
      </body>
    </html>
  )
}
