'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  FileText,
  Plus,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session } = useSession()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['organization-stats'],
    queryFn: () => apiClient.getOrganizationStats(),
  })

  const { data: recentLeads } = useQuery({
    queryKey: ['recent-leads'],
    queryFn: () => apiClient.getLeads({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
  })

  const { data: upcomingJobs } = useQuery({
    queryKey: ['upcoming-jobs'],
    queryFn: () => apiClient.getJobs({ limit: 5, sortBy: 'startDate', sortOrder: 'asc' }),
  })

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Seamless Solutions</h1>
          <p className="text-gray-600 mt-2">Please sign in to access your dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {session.user.name || session.user.email}!
              </h1>
              <p className="text-gray-600 mt-1">
                {session.user.organization?.name || 'Your Organization'}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button asChild>
                <Link href="/leads/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Lead
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/bids/calculate">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Calculate Bid
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.leads?.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.leads?.active || 0} active leads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.contacts?.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                All contacts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobs Completed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.jobs?.completed || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.jobs?.total || 0} total jobs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invoices Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.invoices?.paid || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.invoices?.total || 0} total invoices
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leads */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>Latest leads in your pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentLeads?.data?.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{lead.title}</p>
                      <p className="text-sm text-gray-500">{lead.contact?.firstName} {lead.contact?.lastName}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={lead.status === 'WON' ? 'default' : 'secondary'}>
                        {lead.status}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/leads/${lead.id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500">No recent leads</p>
                )}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/leads">View all leads</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Jobs</CardTitle>
              <CardDescription>Scheduled jobs for the next few days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingJobs?.data?.map((job) => (
                  <div key={job.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{job.title}</p>
                      <p className="text-sm text-gray-500">
                        {job.startDate ? new Date(job.startDate).toLocaleDateString() : 'No date set'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={job.status === 'COMPLETED' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/jobs/${job.id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500">No upcoming jobs</p>
                )}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/jobs">View all jobs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col" asChild>
                  <Link href="/leads/new">
                    <Users className="h-6 w-6 mb-2" />
                    New Lead
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col" asChild>
                  <Link href="/bids/calculate">
                    <TrendingUp className="h-6 w-6 mb-2" />
                    Calculate Bid
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col" asChild>
                  <Link href="/quotes/new">
                    <FileText className="h-6 w-6 mb-2" />
                    New Quote
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col" asChild>
                  <Link href="/appointments/new">
                    <Calendar className="h-6 w-6 mb-2" />
                    Schedule
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
