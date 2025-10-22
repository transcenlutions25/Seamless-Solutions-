import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  CheckCircle, 
  Users, 
  Calendar, 
  DollarSign, 
  BarChart, 
  Zap,
  Shield,
  Clock
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-primary px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Seamless Solutions
          </h1>
          <p className="mt-6 text-lg leading-8 text-white/90">
            The unified platform for service businesses to manage leads, schedule jobs, 
            send invoices, and grow revenue — all in one place.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="font-semibold">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="font-semibold text-white border-white hover:bg-white/10">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to run your service business
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              From lead capture to payment collection, streamline every aspect of your operations.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="flex flex-col">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                      <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Trusted by service businesses worldwide
              </h2>
            </div>
            <dl className="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.id} className="flex flex-col bg-white p-8">
                  <dt className="text-sm font-semibold leading-6 text-gray-600">{stat.name}</dt>
                  <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to streamline your business?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/90">
              Join thousands of service businesses already using Seamless Solutions. 
              Start your 30-day free trial today.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="font-semibold">
                  Get started for free
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="font-semibold text-white border-white hover:bg-white/10">
                  Contact sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="text-center">
            <p className="text-sm leading-5">
              © {new Date().getFullYear()} Seamless Solutions. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    name: 'Lead Management',
    description: 'Capture and nurture leads with our intelligent pipeline. Convert prospects to customers seamlessly.',
    icon: Users,
  },
  {
    name: 'AI-Powered Bidding',
    description: 'Generate accurate quotes instantly with our smart pricing engine that learns from your business.',
    icon: Zap,
  },
  {
    name: 'Job Scheduling',
    description: 'Dispatch teams efficiently with drag-and-drop scheduling and real-time status updates.',
    icon: Calendar,
  },
  {
    name: 'Invoice & Payments',
    description: 'Send professional invoices and get paid faster with integrated Stripe payment processing.',
    icon: DollarSign,
  },
  {
    name: 'Field Portal',
    description: 'Empower field teams with mobile clock-in, task management, and quality control photos.',
    icon: CheckCircle,
  },
  {
    name: 'Analytics Dashboard',
    description: 'Track KPIs, conversion rates, and revenue trends to make data-driven decisions.',
    icon: BarChart,
  },
];

const stats = [
  { id: 1, name: 'Active Businesses', value: '10,000+' },
  { id: 2, name: 'Jobs Completed', value: '1M+' },
  { id: 3, name: 'Invoices Processed', value: '$500M+' },
  { id: 4, name: 'Time Saved Weekly', value: '15 hrs' },
];