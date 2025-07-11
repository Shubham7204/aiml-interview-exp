import Link from "next/link"
import { GraduationCap } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-card border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          <div className="flex items-center gap-3">
            <img src="/djsce-logo.png" alt="DJSCE Logo" className="w-8 h-8 object-contain" />
            <div>
              <p className="font-medium text-foreground">Department of AIML, DJSCE</p>
              <p className="text-sm text-muted-foreground">Placement Interview Experiences</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
