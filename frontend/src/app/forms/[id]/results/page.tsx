'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Form, Response, FormStats } from '@/types';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { showToast } from '@/components/ui/Toaster';
import {
  Download,
  BarChart3,
  Table as TableIcon,
  Eye,
  Calendar,
  X,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  UserCheck,
  Search
} from 'lucide-react';

export default function ResultsPage() {
  const params = useParams();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [stats, setStats] = useState<FormStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'summary' | 'responses'>('summary');
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);
  const [tableSearch, setTableSearch] = useState('');

  useEffect(() => {
    const loadResultsData = async () => {
      try {
        setLoading(true);
        const [formData, respData, statsData] = await Promise.all([
          api.getForm(formId),
          api.getFormResponses(formId),
          api.getFormStats(formId),
        ]);
        setForm(formData);
        setResponses(respData);
        setStats(statsData);
      } catch (err: any) {
        showToast('Error', 'Failed to load form responses', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (formId) loadResultsData();
  }, [formId]);

  const handleExportCSV = () => {
    if (!form) return;
    const url = api.getExportCsvUrl(form.id);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${form.title.toLowerCase().replace(/\s+/g, '_')}_responses.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export Started', 'Downloading responses as CSV file.', 'success');
  };

  if (loading || !form) {
    return (
      <div suppressHydrationWarning className="min-h-screen bg-white flex items-center justify-center">
        <div suppressHydrationWarning className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div suppressHydrationWarning className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header form={form} onFormUpdate={(u) => setForm(u)} activeTab="results" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {/* Top Header & Analytics summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Results & Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">
              Review individual submissions and aggregate statistical breakdowns.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={responses.length === 0}
            className="flex items-center justify-center gap-2 bg-[#0445AF] hover:bg-[#033891] disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export to CSV</span>
          </button>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Responses</span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-0.5">{responses.length}</h2>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completion Rate</span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-0.5">
                {responses.length > 0 ? '100%' : '0%'}
              </h2>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Time to Complete</span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-0.5">1m 12s</h2>
            </div>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-xl px-4 pt-2">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-3 px-5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'summary'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Question Insights</span>
          </button>
          <button
            onClick={() => setActiveTab('responses')}
            className={`py-3 px-5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'responses'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>Responses Table ({responses.length})</span>
          </button>
        </div>

        {/* Content Views */}
        {responses.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center my-4">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-800">No responses collected yet</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 mb-4">
              Publish your form and share the public link to start receiving submissions.
            </p>
            {form.status === 'published' && (
              <a
                href={`/to/${form.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#0445AF] hover:bg-[#033891] text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                <span>Fill Form</span>
              </a>
            )}
          </div>
        ) : activeTab === 'summary' ? (
          <div className="space-y-6">
            {stats?.question_stats.map((qStat, idx) => (
              <div key={qStat.question_id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-600">Q{idx + 1} • {qStat.type.replace('_', ' ')}</span>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">{qStat.title}</h3>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {qStat.total_answers} response{qStat.total_answers === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Option Breakdown Visualizer */}
                {qStat.option_counts && Object.keys(qStat.option_counts).length > 0 && (
                  <div className="space-y-3 pt-2">
                    {Object.entries(qStat.option_counts).map(([optName, count]) => {
                      const percentage = qStat.total_answers > 0 ? Math.round((count / qStat.total_answers) * 100) : 0;
                      return (
                        <div key={optName} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-gray-700">
                            <span>{optName}</span>
                            <span className="text-gray-500">{count} ({percentage}%)</span>
                          </div>
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#0445AF] rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Average Rating Badge */}
                {qStat.average_rating !== null && qStat.average_rating !== undefined && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 inline-block">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">Average Rating</span>
                    <span className="text-2xl font-extrabold text-amber-900">{qStat.average_rating} / 5.0</span>
                  </div>
                )}

                {/* Text Response Samples */}
                {qStat.text_samples && qStat.text_samples.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Answers</span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {qStat.text_samples.map((sample, sIdx) => (
                        <div key={sIdx} className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs text-gray-800 leading-relaxed font-mono">
                          "{sample}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search response answers..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">#</th>
                      <th className="py-3.5 px-4">Submitted At</th>
                      {form.questions.map((q) => (
                        <th key={q.id} className="py-3.5 px-4 max-w-[200px] truncate">
                          {q.title}
                        </th>
                      ))}
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {responses
                      .filter((resp) => {
                        if (!tableSearch.trim()) return true;
                        const query = tableSearch.toLowerCase();
                        return Object.values(resp.answers).some((val) =>
                          String(val).toLowerCase().includes(query)
                        );
                      })
                      .map((resp, rIdx) => (
                        <tr key={resp.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-gray-400">{rIdx + 1}</td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-gray-500 font-mono">
                            {new Date(resp.submitted_at).toLocaleString()}
                          </td>
                          {form.questions.map((q) => (
                            <td key={q.id} className="py-3.5 px-4 max-w-[200px] truncate">
                              {resp.answers[q.id] !== undefined ? String(resp.answers[q.id]) : '-'}
                            </td>
                          ))}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedResponse(resp)}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Individual Response Detail Modal */}
      {selectedResponse && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-scale-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Submission Details</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  Submitted: {new Date(selectedResponse.submitted_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedResponse(null)}
                className="p-1 rounded text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {form.questions.map((q, idx) => (
                <div key={q.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Question {idx + 1}</span>
                  <h4 className="text-xs font-semibold text-gray-800">{q.title}</h4>
                  <p className="text-sm font-semibold text-[#0445AF] font-mono pt-1">
                    {selectedResponse.answers[q.id] !== undefined
                      ? String(selectedResponse.answers[q.id])
                      : '(No answer)'}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedResponse(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
