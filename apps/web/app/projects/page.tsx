'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

export default function ProjectsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadProjects();
  }, [isAuthenticated, router]);

  const loadProjects = async () => {
    try {
      const response = await api.getProjects();
      if (response.success && response.data) {
        setProjects((response.data as any)?.data || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PLANNING: 'badge-info',
      IN_PROGRESS: 'badge-warning',
      COMPLETED: 'badge-success',
      ARCHIVED: 'badge-danger',
    };
    return badges[status] || 'badge-info';
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Projects</h2>
            <p className="text-gray-600 mt-2">Manage your projects and track progress</p>
          </div>
          <Link href="/projects/new" className="btn-primary">
            + New Project
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">No projects yet</p>
            <Link href="/projects/new" className="btn-primary">
              Create Your First Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="card hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                  <span className={`${getStatusBadge(project.status)}`}>{project.status}</span>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{project._count?.tasks || 0} tasks</span>
                  <span>{project._count?.members || 0} members</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
