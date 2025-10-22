'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Zap, Users, BarChart3, Calendar, DollarSign } from 'lucide-react'
import Link from 'next/link'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Seamless Solutions</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-gray-600 hover:text-primary">
              Features
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-primary">
              Pricing
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-primary">
              Login
            </Link>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Streamline Your
            <span className="text-primary block">Service Business</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Complete platform for service-based businesses to manage leads, calculate bids, 
            schedule jobs, send invoices, and track performance. Everything you need in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">Start Free Trial</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/demo">View Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Grow
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From lead generation to payment collection, we've got every aspect 
              of your service business covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="card-shadow">
              <CardHeader>
                <Users className="w-10 h-10 text-primary mb-4" />
                <CardTitle>CRM & Lead Management</CardTitle>
                <CardDescription>
                  Capture leads from your website, track them through your pipeline, 
                  and convert them into paying customers.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <BarChart3 className="w-10 h-10 text-primary mb-4" />
                <CardTitle>AI-Powered Bid Calculator</CardTitle>
                <CardDescription>
                  Generate accurate quotes instantly with our intelligent pricing engine 
                  that factors in complexity, urgency, and market conditions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <Calendar className="w-10 h-10 text-primary mb-4" />
                <CardTitle>Scheduling & Dispatch</CardTitle>
                <CardDescription>
                  Coordinate your team with smart scheduling, real-time updates, 
                  and automated customer notifications.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <DollarSign className="w-10 h-10 text-primary mb-4" />
                <CardTitle>Invoicing & Payments</CardTitle>
                <CardDescription>
                  Send professional invoices and get paid faster with integrated 
                  payment processing and automated reminders.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <Zap className="w-10 h-10 text-primary mb-4" />
                <CardTitle>Marketing Automation</CardTitle>
                <CardDescription>
                  Stay connected with customers through automated email and SMS campaigns 
                  that drive repeat business.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <BarChart3 className="w-10 h-10 text-primary mb-4" />
                <CardTitle>Analytics & Insights</CardTitle>
                <CardDescription>
                  Make data-driven decisions with comprehensive reporting on sales, 
                  performance, and customer satisfaction.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-primary-50">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why Service Businesses Choose Us
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Increase Revenue by 30%</h3>
                    <p className="text-gray-600">
                      Our AI pricing optimization and automated follow-ups help you close more deals at better margins.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Save 10+ Hours Per Week</h3>
                    <p className="text-gray-600">
                      Automate repetitive tasks like scheduling, invoicing, and customer communications.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Improve Customer Satisfaction</h3>
                    <p className="text-gray-600">
                      Professional communications, on-time service, and transparent pricing build trust.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Scale Without Complexity</h3>
                    <p className="text-gray-600">
                      Our platform grows with you, from solo operations to multi-team enterprises.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 card-shadow">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Ready to Get Started?
              </h3>
              <div className="space-y-4">
                <Button className="w-full" size="lg" asChild>
                  <Link href="/register">Start Your Free Trial</Link>
                </Button>
                <p className="text-center text-sm text-gray-600">
                  No credit card required • 14-day free trial • Setup in 5 minutes
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Seamless Solutions</span>
              </div>
              <p className="text-gray-400">
                The complete platform for service-based businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-white">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/support" className="hover:text-white">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Seamless Solutions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}