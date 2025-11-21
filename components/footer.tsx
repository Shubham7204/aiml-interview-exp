import Link from "next/link"
import { GraduationCap } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-card border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <img src="/djsce-logo.png" alt="DJSCE Logo" className="w-8 h-8 object-contain" />
            <div>
              <p className="font-medium text-foreground">Department of AIML, DJSCE</p>
              <p className="text-sm text-muted-foreground">Placement Interview Experiences</p>
            </div>
          </div>
          <div className="w-full flex justify-center">
            <div className="w-full max-w-xs flex flex-col items-center">
              <div className="w-full flex items-center justify-center my-2">
                <span className="h-px w-8 bg-border rounded-full mr-3" />
                <Link href="/important"
                  className="px-4 py-1 rounded-full bg-accent/40 text-primary font-medium shadow-sm hover:bg-accent/70 transition-colors border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  Other Imp Exp
                </Link>
                <span className="h-px w-8 bg-border rounded-full ml-3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
