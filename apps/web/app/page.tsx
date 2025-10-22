import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">Seamless Solutions</h1>
            </div>
            <div className="flex gap-4">
              <Link href="/login" className="btn-outline">
                Login
              </Link>
              <Link href="/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Manage Projects with Ease
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A modern, full-featured project management platform built with cutting-edge
            technology. Organize tasks, collaborate with your team, and ship faster.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register" className="btn-primary text-lg px-8 py-3">
              Start Free Trial
            </Link>
            <Link href="/about" className="btn-outline text-lg px-8 py-3">
              Learn More
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="card text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-600">
              Built with Next.js 15 and optimized for performance
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Secure & Reliable</h3>
            <p className="text-gray-600">
              Enterprise-grade security with JWT authentication
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Real-time Updates</h3>
            <p className="text-gray-600">
              Stay in sync with your team with instant updates
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold mb-6">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <span className="text-primary-500 text-2xl">✓</span>
              <div>
                <h4 className="font-semibold mb-1">Project Management</h4>
                <p className="text-gray-600">
                  Create and organize projects with custom workflows
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary-500 text-2xl">✓</span>
              <div>
                <h4 className="font-semibold mb-1">Task Tracking</h4>
                <p className="text-gray-600">
                  Track tasks with priorities, statuses, and assignments
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary-500 text-2xl">✓</span>
              <div>
                <h4 className="font-semibold mb-1">Team Collaboration</h4>
                <p className="text-gray-600">
                  Invite team members and collaborate in real-time
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary-500 text-2xl">✓</span>
              <div>
                <h4 className="font-semibold mb-1">REST API</h4>
                <p className="text-gray-600">
                  Full REST API for integrations and automation
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white mt-16 py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>&copy; 2025 Seamless Solutions. Built with Next.js, Fastify, and PostgreSQL.</p>
        </div>
      </footer>
    </div>
  );
}
