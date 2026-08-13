'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Form } from '@/types';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { showToast } from '@/components/ui/Toaster';
import { FORM_TEMPLATES, FormTemplate } from '@/lib/templates';
import {
  Plus,
  Copy,
  Trash2,
  Share2,
  ExternalLink,
  Search,
  FileText,
  BarChart3,
  MoreVertical,
  Check,
  Edit2,
  LayoutTemplate,
  Sparkles,
  Users,
  CheckCircle,
  FileCode,
  X
} from 'lucide-react';

export default function DashboardPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await api.getForms();
      setForms(data);
    } catch (err: any) {
      showToast('Error', 'Failed to load forms. Make sure the backend server is running.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  const handleCreateBlankForm = async () => {
    try {
      const newForm = await api.createForm({
        title: 'My New Typeform',
        description: 'Welcome to this form!',
        status: 'draft',
        welcome_enabled: true,
        welcome_title: 'Welcome!',
        welcome_description: 'Please answer the following questions.',
        welcome_button_text: 'Start Form',
        questions: [
          {
            id: 'q_' + Math.random().toString(36).substring(2, 9),
            type: 'short_text',
            title: 'What is your name?',
            description: '',
            required: true,
            order: 0,
          },
        ],
      });
      showToast('Form Created!', 'Redirecting to builder...', 'success');
      window.location.href = `/forms/${newForm.id}/builder`;
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to create form', 'error');
    }
  };

  const handleCreateFromTemplate = async (template: FormTemplate) => {
    try {
      const newForm = await api.createForm({
        title: template.name,
        description: template.description,
        status: 'draft',
        theme: template.theme,
        welcome_enabled: true,
        welcome_title: template.welcome_title,
        welcome_description: template.welcome_description,
        welcome_button_text: template.welcome_button_text,
        thank_you_title: template.thank_you_title,
        thank_you_description: template.thank_you_description,
        questions: template.questions.map((q) => ({
          ...q,
          id: 'q_' + Math.random().toString(36).substring(2, 9),
        })),
      });
      showToast('Template Applied!', `Created "${template.name}"`, 'success');
      window.location.href = `/forms/${newForm.id}/builder`;
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to apply template', 'error');
    }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const dup = await api.duplicateForm(id);
      setForms((prev) => [dup, ...prev]);
      showToast('Form Duplicated', `Created "${dup.title}"`, 'success');
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to duplicate form', 'error');
    } finally {
      setActiveMenuId(null);
    }
  };

  const handleDelete = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.deleteForm(id);
      setForms((prev) => prev.filter((f) => f.id !== id));
      showToast('Form Deleted', `"${title}" has been deleted.`, 'info');
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to delete form', 'error');
    } finally {
      setActiveMenuId(null);
    }
  };

  const handleTogglePublish = async (form: Form, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = form.status === 'published' ? 'draft' : 'published';
    try {
      const updated = await api.updateForm(form.id, { status: newStatus });
      setForms((prev) => prev.map((f) => (f.id === form.id ? updated : f)));
      showToast(
        newStatus === 'published' ? 'Form Published!' : 'Form Unpublished',
        newStatus === 'published'
          ? 'Form is now public and ready for responses.'
          : 'Form is hidden from respondents.',
        newStatus === 'published' ? 'success' : 'info'
      );
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to update status', 'error');
    } finally {
      setActiveMenuId(null);
    }
  };

  const handleRename = async (formId: string) => {
    if (!tempTitle.trim()) return;
    try {
      const updated = await api.updateForm(formId, { title: tempTitle.trim() });
      setForms((prev) => prev.map((f) => (f.id === formId ? updated : f)));
      showToast('Renamed', 'Form title updated.', 'success');
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to rename form', 'error');
    } finally {
      setEditingTitleId(null);
    }
  };

  const copyShareLink = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/to/${slug}`;
    navigator.clipboard.writeText(url);
    showToast('Link Copied!', 'Shareable link copied to clipboard.', 'success');
    setActiveMenuId(null);
  };

  const totalResponses = forms.reduce((acc, f) => acc + (f.response_count || 0), 0);
  const publishedCount = forms.filter((f) => f.status === 'published').length;

  const filteredForms = forms.filter((f) => {
    const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div suppressHydrationWarning className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {/* Top Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Workspace Forms</h1>
            <p className="text-sm text-gray-500 mt-1">
              Create, edit, and collect responses with signature Typeform UX.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-4 py-2.5 rounded-lg font-semibold shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Use Template</span>
            </button>

            <button
              onClick={handleCreateBlankForm}
              className="flex items-center justify-center gap-2 bg-[#0445AF] hover:bg-[#033891] text-white px-5 py-2.5 rounded-lg font-semibold shadow-md transition-all active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" />
              <span>Create Blank</span>
            </button>
          </div>
        </div>

        {/* Workspace Metrics Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Total Forms</span>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{forms.length}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Published Forms</span>
              <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">{publishedCount}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Collected Responses</span>
              <h3 className="text-2xl font-bold text-indigo-600 mt-0.5">{totalResponses}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search bar & Status Filter tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search forms by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#367EE9] focus:ring-1 focus:ring-[#367EE9]"
            />
          </div>

          <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-lg text-xs font-semibold shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'all' ? 'bg-[#0445AF] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({forms.length})
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'published' ? 'bg-[#0445AF] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Published ({publishedCount})
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'draft' ? 'bg-[#0445AF] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Drafts ({forms.length - publishedCount})
            </button>
          </div>
        </div>

        {/* Form Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center my-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-800">No forms found</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 mb-4">
              {searchQuery ? 'No forms match your search filter.' : 'Create your first form to start collecting responses.'}
            </p>
            <button
              onClick={handleCreateBlankForm}
              className="inline-flex items-center gap-2 bg-[#0445AF] hover:bg-[#033891] text-white px-4 py-2 rounded-lg font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Form</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredForms.map((form) => (
              <div
                key={form.id}
                onClick={() => (window.location.href = `/forms/${form.id}/builder`)}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        form.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {form.status}
                    </span>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === form.id ? null : form.id);
                        }}
                        className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === form.id && (
                        <div
                          className="absolute right-0 top-7 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 text-xs font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => {
                              setEditingTitleId(form.id);
                              setTempTitle(form.title);
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Rename</span>
                          </button>
                          <button
                            onClick={(e) => handleTogglePublish(form, e)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{form.status === 'published' ? 'Unpublish' : 'Publish'}</span>
                          </button>
                          {form.status === 'published' && (
                            <button
                              onClick={(e) => copyShareLink(form.slug, e)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Copy Link</span>
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDuplicate(form.id, e)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Duplicate</span>
                          </button>
                          <hr className="my-1 border-gray-100" />
                          <button
                            onClick={(e) => handleDelete(form.id, form.title, e)}
                            className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {editingTitleId === form.id ? (
                    <div className="flex items-center gap-1 mb-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename(form.id)}
                        className="flex-1 text-base font-semibold px-2 py-1 border border-blue-500 rounded focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRename(form.id)}
                        className="bg-blue-600 text-white text-xs px-2 py-1 rounded"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-[#0445AF] transition-colors line-clamp-1 mb-1">
                      {form.title}
                    </h3>
                  )}

                  <p className="text-xs text-gray-500 line-clamp-2 min-h-[32px]">
                    {form.description || 'No description provided.'}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-3 mt-4 flex items-center justify-between text-xs text-gray-500 font-medium">
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-3.5 h-3.5 text-gray-400" />
                    <span>{form.response_count} response{form.response_count === 1 ? '' : 's'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/forms/${form.id}/results`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-gray-900 underline"
                    >
                      Results
                    </Link>
                    {form.status === 'published' && (
                      <a
                        href={`/to/${form.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#0445AF] hover:underline flex items-center gap-0.5"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Template Chooser Modal */}
      {isTemplateModalOpen && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Choose a Template</h3>
                <p className="text-xs text-gray-500">Kickstart your form with pre-built question structures and styling.</p>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FORM_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => handleCreateFromTemplate(tmpl)}
                  className="bg-gray-50 hover:bg-blue-50/50 border border-gray-200 hover:border-blue-500 rounded-xl p-4 cursor-pointer transition-all space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      {tmpl.category}
                    </span>
                    <span className="text-xs text-gray-400">{tmpl.questions.length} questions</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {tmpl.name}
                    </h4>
                    <p className="text-xs text-gray-500 leading-snug mt-1">{tmpl.description}</p>
                  </div>

                  <div className="pt-2 flex items-center text-xs font-semibold text-blue-600 group-hover:underline">
                    <span>Use Template →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
