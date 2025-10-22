import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-primary-600">Seamless Solutions</h1>
            </Link>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">About Seamless Solutions</h2>

        <div className="prose prose-lg max-w-none space-y-6">
          <div className="card">
            <h3 className="text-2xl font-semibold mb-4">Our Mission</h3>
            <p className="text-gray-600">
              Seamless Solutions is built to demonstrate a complete, production-ready full-stack
              application with modern best practices. This platform showcases enterprise-grade
              architecture, security, and scalability.
            </p>
          </div>

          <div className="card">
            <h3 className="text-2xl font-semibold mb-4">Technology Stack</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-primary-600 mb-2">Frontend</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Next.js 15 (App Router)</li>
                  <li>• React 18</li>
                  <li>• TypeScript</li>
                  <li>• Tailwind CSS</li>
                  <li>• Zustand (State Management)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-primary-600 mb-2">Backend</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Fastify (Node.js)</li>
                  <li>• Prisma ORM</li>
                  <li>• PostgreSQL</li>
                  <li>• Redis</li>
                  <li>• JWT Authentication</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-2xl font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Complete authentication system with JWT</li>
              <li>✓ Project and task management</li>
              <li>✓ Role-based access control (RBAC)</li>
              <li>✓ RESTful API with comprehensive endpoints</li>
              <li>✓ Docker containerization</li>
              <li>✓ CI/CD pipeline with GitHub Actions</li>
              <li>✓ Comprehensive testing suite</li>
              <li>✓ Production-ready security measures</li>
              <li>✓ Rate limiting and CORS protection</li>
              <li>✓ Structured logging and monitoring</li>
            </ul>
          </div>

          <div className="card">
            <h3 className="text-2xl font-semibold mb-4">Architecture Highlights</h3>
            <p className="text-gray-600 mb-3">
              This application follows industry best practices and modern architectural patterns:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li>• Monorepo structure with pnpm workspaces</li>
              <li>• Shared packages for types, config, and utilities</li>
              <li>• Clean separation of concerns</li>
              <li>• Comprehensive error handling</li>
              <li>• Production-optimized Docker builds</li>
              <li>• Health check endpoints</li>
              <li>• Graceful shutdown handling</li>
            </ul>
          </div>

          <div className="text-center mt-12">
            <Link href="/register" className="btn-primary text-lg px-8 py-3">
              Get Started Now
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
