'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [stats, setStats] = useState({
    projects: 0,
    tasks: 0,
    completedTasks: 0,
  });
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadStats();
  }, [isAuthenticated, router]);

  const loadStats = async () => {
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        api.getProjects(),
        api.getTasks(),
      ]);

      if (projectsRes.success && tasksRes.success) {
        const projects = (projectsRes.data as any)?.data || [];
        const tasks = (tasksRes.data as any)?.data || [];
        const completedTasks = tasks.filter((t: any) => t.status === 'DONE').length;

        setStats({
          projects: projects.length,
          tasks: tasks.length,
          completedTasks,
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-2">Welcome back, {user?.name}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
            <h3 className="text-lg font-semibold mb-2">Total Projects</h3>
            <p className="text-4xl font-bold">{stats.projects}</p>
            <Link href="/projects" className="mt-4 inline-block text-sm hover:underline">
              View all →
            </Link>
          </div>

          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <h3 className="text-lg font-semibold mb-2">Active Tasks</h3>
            <p className="text-4xl font-bold">{stats.tasks}</p>
            <Link href="/tasks" className="mt-4 inline-block text-sm hover:underline">
              View all →
            </Link>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <h3 className="text-lg font-semibold mb-2">Completed</h3>
            <p className="text-4xl font-bold">{stats.completedTasks}</p>
            <p className="mt-4 text-sm">
              {stats.tasks > 0
                ? `${Math.round((stats.completedTasks / stats.tasks) * 100)}% completion rate`
                : 'No tasks yet'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/projects/new" className="btn-primary w-full block text-center">
                + Create New Project
              </Link>
              <Link href="/tasks/new" className="btn-outline w-full block text-center">
                + Add New Task
              </Link>
            </div>
          </div>

          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Getting Started</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-500">•</span>
                <span>Create your first project to organize your work</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500">•</span>
                <span>Add tasks and track their progress</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500">•</span>
                <span>Invite team members to collaborate</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500">•</span>
                <span>Use the API for custom integrations</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
