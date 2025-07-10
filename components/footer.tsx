import Link from "next/link"
import { GraduationCap } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <img src="/djsce-logo.png" alt="DJSCE Logo" className="w-8 h-8 object-contain" />
            <div>
              <p className="font-medium text-gray-900">Department of AIML, DJSCE</p>
              <p className="text-sm text-gray-600">Placement Experience Portal</p>
            </div>
          </div>

          <div className="flex gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <GraduationCap className="w-4 h-4" />
              AIML 26
            </Link>
            <Link
              href="/aiml-25"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <GraduationCap className="w-4 h-4" />
              AIML 25
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
