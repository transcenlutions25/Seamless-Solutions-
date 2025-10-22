'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Plus } from 'lucide-react';

const STATUS_COLUMNS = ['NEW', 'CONTACTED', 'QUALIFIED', 'QUOTED', 'WON', 'LOST'];

export default function LeadsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const result = await api.getLeads();
      setData(result);
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await api.updateLead(leadId, { status: newStatus });
      loadLeads();
    } catch (error) {
      console.error('Failed to update lead:', error);
    }
  };

  const handleConvert = async (leadId: string) => {
    try {
      await api.convertLead(leadId);
      loadLeads();
    } catch (error) {
      console.error('Failed to convert lead:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading leads...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-1">Manage your sales pipeline</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Lead
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_COLUMNS.map((status) => (
          <div key={status} className="flex-shrink-0 w-80">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{status}</h3>
                <span className="text-sm text-gray-600">
                  {data?.kanban?.[status]?.length || 0}
                </span>
              </div>

              <div className="space-y-3">
                {data?.kanban?.[status]?.map((lead: any) => (
                  <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {lead.contact?.firstName} {lead.contact?.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {lead.contact?.email}
                          </p>
                        </div>
                        {lead.priority <= 2 && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            High
                          </span>
                        )}
                      </div>

                      {lead.estimatedValue && (
                        <p className="text-sm font-medium text-[#00A8A8]">
                          {formatCurrency(lead.estimatedValue)}
                        </p>
                      )}

                      {lead.description && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                          {lead.description}
                        </p>
                      )}

                      <div className="mt-3 flex gap-2">
                        {status === 'QUALIFIED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConvert(lead.id)}
                            className="text-xs"
                          >
                            Convert
                          </Button>
                        )}
                        <select
                          value={status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className="text-xs border rounded px-2 py-1"
                        >
                          {STATUS_COLUMNS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
