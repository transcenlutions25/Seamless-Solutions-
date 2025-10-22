'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

export default function TasksPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadTasks();
  }, [isAuthenticated, router]);

  const loadTasks = async () => {
    try {
      const response = await api.getTasks();
      if (response.success && response.data) {
        setTasks((response.data as any)?.data || []);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      TODO: 'badge-info',
      IN_PROGRESS: 'badge-warning',
      REVIEW: 'badge-warning',
      DONE: 'badge-success',
    };
    return badges[status] || 'badge-info';
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, string> = {
      LOW: 'badge-info',
      MEDIUM: 'badge-warning',
      HIGH: 'badge-danger',
      URGENT: 'bg-red-600 text-white',
    };
    return badges[priority] || 'badge-info';
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
            <h2 className="text-3xl font-bold text-gray-900">Tasks</h2>
            <p className="text-gray-600 mt-2">Track and manage your tasks</p>
          </div>
          <Link href="/tasks/new" className="btn-primary">
            + New Task
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">No tasks yet</p>
            <Link href="/tasks/new" className="btn-primary">
              Create Your First Task
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                      <span className={`${getStatusBadge(task.status)}`}>{task.status}</span>
                      <span className={`badge ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{task.description}</p>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>Project: {task.project?.name || 'N/A'}</span>
                      {task.assignee && <span>Assigned to: {task.assignee.name}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
