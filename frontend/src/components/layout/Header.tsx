'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Form } from '@/types';
import { api } from '@/lib/api';
import { showToast } from '@/components/ui/Toaster';
import {
  ArrowLeft,
  Play,
  CheckCircle,
  Share2,
  BarChart2,
  Edit3,
  Settings,
  ChevronDown,
  Copy,
  Link2,
  ExternalLink,
  X,
  QrCode,
  Code2,
  User
} from 'lucide-react';

interface HeaderProps {
  form?: Form;
  onFormUpdate?: (updated: Form) => void;
  activeTab?: 'builder' | 'results' | 'settings';
}

function ShareModal({ form, onClose }: { form: Form; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/to/${form.slug}`;
  const embedCode = `<iframe src="${shareUrl}" width="100%" height="500" frameborder="0"></iframe>`;

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Copied!', `${label} copied to clipboard.`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-0 shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Share this form</h3>
              <p className="text-xs text-gray-500">{form.status === 'published' ? 'Published and ready to collect responses' : 'Publish first to make this link accessible'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Share Link */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Shareable Link</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 overflow-hidden">
                <Link2 className="w-4 h-4 text-gray-400 shrink-0 mr-2" />
                <span className="text-xs text-gray-700 truncate font-mono">{shareUrl}</span>
              </div>
              <button
                onClick={() => copyToClipboard(shareUrl, 'Link')}
                className="shrink-0 px-4 py-2 bg-[#0445AF] hover:bg-[#033891] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Preview button */}
          <a
            href={`/to/${form.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Preview Form in New Tab</span>
          </a>

          {/* Embed Code */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Embed Code</label>
            <div className="flex items-start gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 overflow-hidden">
                <code className="text-[10px] text-gray-600 font-mono break-all leading-relaxed">{embedCode}</code>
              </div>
              <button
                onClick={() => copyToClipboard(embedCode, 'Embed code')}
                className="shrink-0 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Status indicator */}
          <div className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-semibold ${
            form.status === 'published'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${form.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>{form.status === 'published' ? 'Form is live and accepting responses' : 'Form is currently a draft'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Header({ form, onFormUpdate, activeTab = 'builder' }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTogglePublish = async () => {
    if (!form) return;
    setIsPublishing(true);
    const newStatus = form.status === 'published' ? 'draft' : 'published';
    try {
      const updated = await api.updateForm(form.id, { status: newStatus });
      onFormUpdate?.(updated);
      showToast(
        newStatus === 'published' ? 'Form Published!' : 'Form Unpublished',
        newStatus === 'published'
          ? 'Your form is now live and shareable.'
          : 'Your form is hidden from respondents.',
        newStatus === 'published' ? 'success' : 'info'
      );
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to update form status', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const isFormEditor = form && (pathname.includes('/builder') || pathname.includes('/results'));

  return (
    <>
      <header className="h-[52px] border-b border-gray-200 bg-white px-4 flex items-center justify-between sticky top-0 z-40 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-[15px] text-gray-900 tracking-tight hover:opacity-80 transition-opacity">
            <div className="w-[26px] h-[26px] rounded-lg bg-[#0445AF] flex items-center justify-center text-white font-extrabold text-[10px] shadow-sm">
              tf
            </div>
            <span>Typeform</span>
          </Link>

          {isFormEditor && (
            <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
              <Link
                href="/"
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                title="Back to Workspace"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <span className="text-sm font-semibold text-gray-800 max-w-[220px] truncate">
                {form.title}
              </span>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wide ${
                  form.status === 'published'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {form.status}
              </span>
            </div>
          )}
        </div>

        {isFormEditor && (
          <div className="flex items-center gap-1 bg-gray-100/80 p-0.5 rounded-lg text-[13px] font-medium">
            <Link
              href={`/forms/${form.id}/builder`}
              className={`flex items-center gap-1.5 px-3 py-[5px] rounded-md transition-all ${
                activeTab === 'builder'
                  ? 'bg-white shadow-sm text-gray-900 font-semibold'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Create</span>
            </Link>
            <Link
              href={`/forms/${form.id}/results`}
              className={`flex items-center gap-1.5 px-3 py-[5px] rounded-md transition-all ${
                activeTab === 'results'
                  ? 'bg-white shadow-sm text-gray-900 font-semibold'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Results{form.response_count > 0 ? ` (${form.response_count})` : ''}</span>
            </Link>
          </div>
        )}

        <div className="flex items-center gap-2">
          {isFormEditor ? (
            <>
              <a
                href={`/to/${form.slug}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600 hover:text-[#0445AF] px-2.5 py-1.5 rounded-md transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Test</span>
              </a>

              {form.status === 'published' && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              )}

              <button
                onClick={handleTogglePublish}
                disabled={isPublishing}
                className={`text-[12px] font-semibold px-4 py-[6px] rounded-lg transition-all flex items-center gap-1.5 shadow-sm ${
                  form.status === 'published'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-[#0445AF] hover:bg-[#033891] text-white'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{form.status === 'published' ? 'Unpublish' : 'Publish'}</span>
              </button>
            </>
          ) : null}

          {/* User Avatar */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0445AF] to-[#367EE9] text-white flex items-center justify-center text-xs font-bold shadow-sm hover:shadow-md transition-shadow"
            >
              C
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-10 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50 animate-scale-in">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">Creator</p>
                  <p className="text-[11px] text-gray-500">creator@typeform.io</p>
                </div>
                <Link href="/" className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Workspace Settings</span>
                </Link>
                <div className="px-4 py-2 text-[10px] text-gray-400">Coming Soon: Team & billing</div>
              </div>
            )}
          </div>
        </div>
      </header>

      {showShareModal && form && <ShareModal form={form} onClose={() => setShowShareModal(false)} />}
    </>
  );
}
