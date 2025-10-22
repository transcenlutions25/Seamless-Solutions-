"use client";
import './globals.css';
import { useEffect, useState } from 'react';
import { devLogin, getLeads, createLead, createBid } from './api';

export default function Page() {
  const [token, setToken] = useState<string | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await devLogin();
      setToken(t);
      const l = await getLeads(t);
      setLeads(l);
    })();
  }, []);

  return (
    <main className="p-10 font-sans text-teal">
      <div className="max-w-3xl mx-auto bg-neutral-900 rounded-xl p-8 shadow-lg">
        <h1 className="text-3xl font-semibold">Seamless Solutions</h1>
        <p className="mt-2 text-gray-400">Production-ready platform scaffold initialized.</p>
        <div className="mt-6 flex gap-3">
          <button
            className="px-4 py-2 rounded-xl bg-teal text-black disabled:opacity-50"
            disabled={!token || busy}
            onClick={async () => {
              setBusy(true);
              try {
                const lead = await createLead(token!);
                setLeads([lead, ...leads]);
              } finally {
                setBusy(false);
              }
            }}
          >
            + New Lead
          </button>
        </div>

        <ul className="mt-6 space-y-3">
          {leads.map((lead) => (
            <li key={lead.id} className="bg-neutral-800/60 border border-neutral-700 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="text-gray-300">{lead.id}</div>
                <div className="text-sm text-gray-500">{lead.status}</div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  className="px-3 py-1 rounded-lg bg-teal text-black text-sm disabled:opacity-50"
                  disabled={!token || busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const { bid, quote } = await createBid(token!, lead.id);
                      alert(`Bid $${bid.total} created; Quote ${quote.id}`);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Create Bid + Quote
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-neutral-800/60 border border-neutral-700 rounded-xl p-4">
      <div className="text-xl text-teal">{title}</div>
      <div className="text-gray-400">{desc}</div>
    </div>
  );
}
