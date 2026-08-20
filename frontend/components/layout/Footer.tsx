import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Platform</h3>
            <ul className="space-y-2">
              <li><Link href="/dashboard/assessment" className="text-gray-600 hover:text-gray-900 transition-colors">Browse Assessments</Link></li>
              <li><Link href="/dashboard/portfolio" className="text-gray-600 hover:text-gray-900 transition-colors">Portfolio</Link></li>
              <li><Link href="/certificates" className="text-gray-600 hover:text-gray-900 transition-colors">Certificates</Link></li>
              <li><Link href="/dashboard/analytics" className="text-gray-600 hover:text-gray-900 transition-colors">Analytics</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Exams</h3>
            <ul className="space-y-2">
              <li><Link href="/dashboard/assessment" className="text-gray-600 hover:text-gray-900 transition-colors">JEE Main & Advanced</Link></li>
              <li><Link href="/dashboard/assessment" className="text-gray-600 hover:text-gray-900 transition-colors">NEET UG</Link></li>
              <li><Link href="/dashboard/assessment" className="text-gray-600 hover:text-gray-900 transition-colors">CBSE Boards</Link></li>
              <li><Link href="/dashboard/assessment" className="text-gray-600 hover:text-gray-900 transition-colors">GATE</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">About Us</Link></li>
              <li><Link href="/dashboard/employer" className="text-gray-600 hover:text-gray-900 transition-colors">Employer Portal</Link></li>
              <li><Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</Link></li>
              <li><Link href="/careers" className="text-gray-600 hover:text-gray-900 transition-colors">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-600 hover:text-gray-900 transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookies" className="text-gray-600 hover:text-gray-900 transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm">© 2026 OpenAssess. Continuous, verified learning for every student.</p>
          <div className="flex gap-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">Home</Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">Login</Link>
            <Link href="/register" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">Sign Up</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
