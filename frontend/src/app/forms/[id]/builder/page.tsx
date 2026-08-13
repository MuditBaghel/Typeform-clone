'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Form, Question, QuestionType, FormTheme } from '@/types';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { SortableQuestionItem } from '@/components/builder/SortableQuestionItem';
import { showToast } from '@/components/ui/Toaster';
import {
  Plus,
  Type,
  AlignLeft,
  List,
  ChevronDown,
  Mail,
  Hash,
  ToggleLeft,
  Star,
  Settings2,
  Palette,
  GitBranch,
  Save,
  Check,
  X,
  PlusCircle,
  Eye,
  Smartphone,
  Monitor,
  Sparkles,
  Layout,
  CheckSquare
} from 'lucide-react';

const QUESTION_TYPES: { type: QuestionType; label: string; icon: React.ReactNode }[] = [
  { type: 'short_text', label: 'Short Text', icon: <Type className="w-4 h-4 text-blue-500" /> },
  { type: 'long_text', label: 'Long Text', icon: <AlignLeft className="w-4 h-4 text-purple-500" /> },
  { type: 'multiple_choice', label: 'Multiple Choice', icon: <List className="w-4 h-4 text-emerald-500" /> },
  { type: 'dropdown', label: 'Dropdown', icon: <ChevronDown className="w-4 h-4 text-amber-500" /> },
  { type: 'email', label: 'Email', icon: <Mail className="w-4 h-4 text-rose-500" /> },
  { type: 'number', label: 'Number', icon: <Hash className="w-4 h-4 text-indigo-500" /> },
  { type: 'yes_no', label: 'Yes/No', icon: <ToggleLeft className="w-4 h-4 text-cyan-500" /> },
  { type: 'rating', label: 'Rating', icon: <Star className="w-4 h-4 text-yellow-500" /> },
];

const THEME_PRESETS: { name: string; theme: FormTheme }[] = [
  {
    name: 'Classic Dark',
    theme: {
      backgroundColor: '#191919',
      textColor: '#FFFFFF',
      buttonColor: '#0445AF',
      buttonTextColor: '#FFFFFF',
      questionTextColor: '#FFFFFF',
      answerTextColor: '#367EE9',
      fontFamily: 'Inter',
    },
  },
  {
    name: 'Midnight Ocean',
    theme: {
      backgroundColor: '#0F172A',
      textColor: '#F8FAFC',
      buttonColor: '#6366F1',
      buttonTextColor: '#FFFFFF',
      questionTextColor: '#F8FAFC',
      answerTextColor: '#818CF8',
      fontFamily: 'Inter',
    },
  },
  {
    name: 'Emerald Forest',
    theme: {
      backgroundColor: '#064E3B',
      textColor: '#ECFDF5',
      buttonColor: '#10B981',
      buttonTextColor: '#FFFFFF',
      questionTextColor: '#ECFDF5',
      answerTextColor: '#34D399',
      fontFamily: 'Inter',
    },
  },
  {
    name: 'Clean Light',
    theme: {
      backgroundColor: '#FFFFFF',
      textColor: '#0F172A',
      buttonColor: '#0284C7',
      buttonTextColor: '#FFFFFF',
      questionTextColor: '#0F172A',
      answerTextColor: '#0284C7',
      fontFamily: 'Inter',
    },
  },
  {
    name: 'Sunset Glow',
    theme: {
      backgroundColor: '#4C0519',
      textColor: '#FFF1F2',
      buttonColor: '#F43F5E',
      buttonTextColor: '#FFFFFF',
      questionTextColor: '#FFF1F2',
      answerTextColor: '#FB7185',
      fontFamily: 'Inter',
    },
  },
  {
    name: 'Dark Onyx',
    theme: {
      backgroundColor: '#030712',
      textColor: '#F9FAFB',
      buttonColor: '#8B5CF6',
      buttonTextColor: '#FFFFFF',
      questionTextColor: '#F9FAFB',
      answerTextColor: '#A78BFA',
      fontFamily: 'Inter',
    },
  },
];

export default function FormBuilderPage() {
  const params = useParams();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'content' | 'theme' | 'logic'>('content');
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewAnswer, setPreviewAnswer] = useState<any>('');
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        const data = await api.getForm(formId);
        setForm(data);
        if (data.questions.length > 0) {
          setSelectedQuestionId(data.questions[0].id);
        }
      } catch (err: any) {
        showToast('Error', 'Failed to load form builder data', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (formId) fetchForm();
  }, [formId]);

  const handleSaveForm = async (updatedForm: Form) => {
    setIsSaving(true);
    try {
      const saved = await api.updateForm(formId, {
        title: updatedForm.title,
        description: updatedForm.description,
        status: updatedForm.status,
        theme: updatedForm.theme,
        welcome_enabled: updatedForm.welcome_enabled,
        welcome_title: updatedForm.welcome_title,
        welcome_description: updatedForm.welcome_description,
        welcome_button_text: updatedForm.welcome_button_text,
        thank_you_title: updatedForm.thank_you_title,
        thank_you_description: updatedForm.thank_you_description,
        thank_you_button_text: updatedForm.thank_you_button_text,
        thank_you_button_url: updatedForm.thank_you_button_url,
        questions: updatedForm.questions.map((q, idx) => ({
          ...q,
          order: idx,
        })),
      });
      setForm(saved);
      showToast('Saved', 'All form changes saved.', 'success');
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to save form', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!form || !over || active.id === over.id) return;

    const oldIndex = form.questions.findIndex((q) => q.id === active.id);
    const newIndex = form.questions.findIndex((q) => q.id === over.id);

    const newQuestions = arrayMove(form.questions, oldIndex, newIndex).map((q, idx) => ({
      ...q,
      order: idx,
    }));

    const updated = { ...form, questions: newQuestions };
    setForm(updated);
    handleSaveForm(updated);
  };

  const handleAddQuestion = (type: QuestionType) => {
    if (!form) return;
    const newId = 'q_' + Math.random().toString(36).substring(2, 9);
    const defaultOptions =
      type === 'multiple_choice' || type === 'dropdown'
        ? ['Option 1', 'Option 2', 'Option 3']
        : type === 'rating'
        ? ['1', '2', '3', '4', '5']
        : [];

    const newQuestion: Question = {
      id: newId,
      form_id: form.id,
      type,
      title: `Untitled ${type.replace('_', ' ')} question`,
      description: '',
      required: false,
      order: form.questions.length,
      options: defaultOptions,
      logic: [],
    };

    const updatedQuestions = [...form.questions, newQuestion];
    const updated = { ...form, questions: updatedQuestions };
    setForm(updated);
    setSelectedQuestionId(newId);
    setIsAddQuestionModalOpen(false);
    handleSaveForm(updated);
  };

  const handleDeleteQuestion = (id: string) => {
    if (!form) return;
    const updatedQuestions = form.questions.filter((q) => q.id !== id);
    const updated = { ...form, questions: updatedQuestions };
    setForm(updated);
    if (selectedQuestionId === id) {
      setSelectedQuestionId(updatedQuestions[0]?.id || null);
    }
    handleSaveForm(updated);
  };

  const handleDuplicateQuestion = (id: string) => {
    if (!form) return;
    const targetIndex = form.questions.findIndex((q) => q.id === id);
    if (targetIndex === -1) return;

    const target = form.questions[targetIndex];
    const newId = 'q_' + Math.random().toString(36).substring(2, 9);
    const duplicated: Question = {
      ...target,
      id: newId,
      title: `${target.title} (Copy)`,
      order: targetIndex + 1,
    };

    const updatedQuestions = [...form.questions];
    updatedQuestions.splice(targetIndex + 1, 0, duplicated);

    const updated = { ...form, questions: updatedQuestions };
    setForm(updated);
    setSelectedQuestionId(newId);
    handleSaveForm(updated);
  };

  const updateSelectedQuestion = (field: keyof Question, value: any) => {
    if (!form || !selectedQuestionId) return;
    const updatedQuestions = form.questions.map((q) => {
      if (q.id === selectedQuestionId) {
        return { ...q, [field]: value };
      }
      return q;
    });
    const updated = { ...form, questions: updatedQuestions };
    setForm(updated);
  };

  const handleOptionChange = (optionIndex: number, val: string) => {
    if (!selectedQuestion) return;
    const currentOpts = [...(selectedQuestion.options || [])];
    currentOpts[optionIndex] = val;
    updateSelectedQuestion('options', currentOpts);
  };

  const handleAddOption = () => {
    if (!selectedQuestion) return;
    const currentOpts = [...(selectedQuestion.options || [])];
    currentOpts.push(`Option ${currentOpts.length + 1}`);
    updateSelectedQuestion('options', currentOpts);
  };

  const handleRemoveOption = (optionIndex: number) => {
    if (!selectedQuestion) return;
    const currentOpts = (selectedQuestion.options || []).filter((_, idx) => idx !== optionIndex);
    updateSelectedQuestion('options', currentOpts);
  };

  const applyPresetTheme = (presetTheme: FormTheme) => {
    if (!form) return;
    const updated = { ...form, theme: presetTheme };
    setForm(updated);
    handleSaveForm(updated);
  };

  const updateTheme = (field: keyof FormTheme, value: string) => {
    if (!form) return;
    const updatedTheme = { ...form.theme, [field]: value };
    const updated = { ...form, theme: updatedTheme };
    setForm(updated);
  };

  if (loading || !form) {
    return (
      <div suppressHydrationWarning className="min-h-screen bg-white flex items-center justify-center">
        <div suppressHydrationWarning className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedQuestion = form.questions.find((q) => q.id === selectedQuestionId);
  const previewQuestion = form.questions[previewIndex] || form.questions[0];

  return (
    <div suppressHydrationWarning className="h-screen bg-gray-50 flex flex-col overflow-hidden font-sans">
      <Header form={form} onFormUpdate={(u) => setForm(u)} activeTab="builder" />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tab bar + Question list / Theme / Logic */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0 z-10">
          {/* Sidebar Mode Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50/50">
            <button
              onClick={() => setActiveSidebarTab('content')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeSidebarTab === 'content'
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Questions</span>
            </button>
            <button
              onClick={() => setActiveSidebarTab('theme')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeSidebarTab === 'theme'
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Design</span>
            </button>
            <button
              onClick={() => setActiveSidebarTab('logic')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeSidebarTab === 'logic'
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Logic</span>
            </button>
          </div>

          {/* Sidebar Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeSidebarTab === 'content' && (
              <>
                {/* Form Title & Welcome message settings */}
                <div className="space-y-2 pb-4 border-b border-gray-100">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Form Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    onBlur={() => handleSaveForm(form)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Description / Subtitle"
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    onBlur={() => handleSaveForm(form)}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Welcome Screen Configurator */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Welcome Screen</span>
                    <input
                      type="checkbox"
                      checked={form.welcome_enabled !== false}
                      onChange={(e) => setForm({ ...form, welcome_enabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </div>
                  {form.welcome_enabled !== false && (
                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        placeholder="Welcome title"
                        value={form.welcome_title || ''}
                        onChange={(e) => setForm({ ...form, welcome_title: e.target.value })}
                        className="w-full px-2.5 py-1 bg-white border border-gray-200 rounded text-xs font-semibold text-gray-800"
                      />
                      <input
                        type="text"
                        placeholder="Welcome description"
                        value={form.welcome_description || ''}
                        onChange={(e) => setForm({ ...form, welcome_description: e.target.value })}
                        className="w-full px-2.5 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600"
                      />
                      <input
                        type="text"
                        placeholder="Start button text"
                        value={form.welcome_button_text || ''}
                        onChange={(e) => setForm({ ...form, welcome_button_text: e.target.value })}
                        className="w-full px-2.5 py-1 bg-white border border-gray-200 rounded text-xs text-gray-800 font-medium"
                      />
                    </div>
                  )}
                </div>

                {/* Add Question Button */}
                <button
                  onClick={() => setIsAddQuestionModalOpen(true)}
                  className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Question</span>
                </button>

                {/* Sortable Question List */}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={form.questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {form.questions.map((question, idx) => (
                        <SortableQuestionItem
                          key={question.id}
                          question={question}
                          index={idx}
                          isSelected={question.id === selectedQuestionId}
                          onSelect={() => {
                            setSelectedQuestionId(question.id);
                            setPreviewIndex(idx);
                          }}
                          onDelete={() => handleDeleteQuestion(question.id)}
                          onDuplicate={() => handleDuplicateQuestion(question.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </>
            )}

            {activeSidebarTab === 'theme' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Preset Themes</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {THEME_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => applyPresetTheme(preset.theme)}
                        className="p-2.5 rounded-xl border border-gray-200 hover:border-blue-500 text-left transition-all flex flex-col justify-between h-16"
                        style={{ backgroundColor: preset.theme.backgroundColor, color: preset.theme.textColor }}
                      >
                        <span className="text-[10px] font-bold truncate">{preset.name}</span>
                        <div
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ backgroundColor: preset.theme.buttonColor }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Custom Colors</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">Background Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={form.theme?.backgroundColor || '#191919'}
                          onChange={(e) => updateTheme('backgroundColor', e.target.value)}
                          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs font-mono text-gray-600">{form.theme?.backgroundColor}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">Button Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={form.theme?.buttonColor || '#0445AF'}
                          onChange={(e) => updateTheme('buttonColor', e.target.value)}
                          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs font-mono text-gray-600">{form.theme?.buttonColor}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">Text Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={form.theme?.textColor || '#FFFFFF'}
                          onChange={(e) => updateTheme('textColor', e.target.value)}
                          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs font-mono text-gray-600">{form.theme?.textColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Thank You Screen</h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Thank you title"
                      value={form.thank_you_title || ''}
                      onChange={(e) => setForm({ ...form, thank_you_title: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800"
                    />
                    <textarea
                      placeholder="Thank you message"
                      value={form.thank_you_description || ''}
                      onChange={(e) => setForm({ ...form, thank_you_description: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 h-16"
                    />
                    <input
                      type="text"
                      placeholder="Button text (e.g. Submit another)"
                      value={form.thank_you_button_text || ''}
                      onChange={(e) => setForm({ ...form, thank_you_button_text: e.target.value })}
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleSaveForm(form)}
                  className="w-full py-2.5 bg-[#0445AF] text-white text-xs font-semibold rounded-lg hover:bg-[#033891]"
                >
                  Apply & Save Design
                </button>
              </div>
            )}

            {activeSidebarTab === 'logic' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Logic Branching</h3>
                <p className="text-xs text-gray-500">
                  Direct respondents to different questions based on their selected answer choices.
                </p>

                {selectedQuestion ? (
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-3">
                    <div className="text-xs font-bold text-gray-700 truncate">
                      Rules for: {selectedQuestion.title}
                    </div>

                    {selectedQuestion.type === 'multiple_choice' || selectedQuestion.type === 'yes_no' ? (
                      <div className="space-y-2">
                        {(selectedQuestion.options || (selectedQuestion.type === 'yes_no' ? ['Yes', 'No'] : [])).map((opt, i) => {
                          const currentRule = (selectedQuestion.logic || []).find((l) => l.ifValue === opt);
                          return (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <span className="font-semibold text-gray-600 w-20 truncate">{opt}:</span>
                              <select
                                value={currentRule?.goToQuestionId || ''}
                                className="flex-1 bg-white border border-gray-200 rounded px-2 py-1 text-xs"
                                onChange={(e) => {
                                  const goToId = e.target.value;
                                  const existingLogic = selectedQuestion.logic || [];
                                  const filtered = existingLogic.filter((l) => l.ifValue !== opt);
                                  if (goToId) {
                                    filtered.push({ ifValue: opt, goToQuestionId: goToId });
                                  }
                                  updateSelectedQuestion('logic', filtered);
                                  handleSaveForm({
                                    ...form,
                                    questions: form.questions.map((q) =>
                                      q.id === selectedQuestion.id ? { ...q, logic: filtered } : q
                                    ),
                                  });
                                }}
                              >
                                <option value="">Next Question (default)</option>
                                <option value="__thank_you__">Submit / End of Form</option>
                                {form.questions.map((q, qIdx) => (
                                  <option key={q.id} value={q.id}>
                                    {qIdx + 1}. {q.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">
                        Logic jumps are available for Multiple Choice and Yes/No questions.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Select a question to edit branching rules.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center - Question Detail / Settings Panel */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col p-5 overflow-y-auto shrink-0">
          {selectedQuestion ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Question Settings</h3>
                <button
                  onClick={() => handleSaveForm(form)}
                  disabled={isSaving}
                  className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Question Title</label>
                <textarea
                  value={selectedQuestion.title}
                  onChange={(e) => updateSelectedQuestion('title', e.target.value)}
                  onBlur={() => handleSaveForm(form)}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Help Text / Description */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Description / Help Text</label>
                <textarea
                  placeholder="Add optional explanation or instructions..."
                  value={selectedQuestion.description || ''}
                  onChange={(e) => updateSelectedQuestion('description', e.target.value)}
                  onBlur={() => handleSaveForm(form)}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Required Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="text-xs font-semibold text-gray-800 block">Required</span>
                  <span className="text-[10px] text-gray-400">Respondents must answer</span>
                </div>
                <input
                  type="checkbox"
                  checked={selectedQuestion.required}
                  onChange={(e) => {
                    updateSelectedQuestion('required', e.target.checked);
                    handleSaveForm({
                      ...form,
                      questions: form.questions.map((q) =>
                        q.id === selectedQuestion.id ? { ...q, required: e.target.checked } : q
                      ),
                    });
                  }}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Options Editor for Choice/Dropdown */}
              {(selectedQuestion.type === 'multiple_choice' || selectedQuestion.type === 'dropdown') && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Answer Choices</label>
                    <button
                      onClick={handleAddOption}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Option</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(selectedQuestion.options || []).map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-400 w-4">{optIdx + 1}.</span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(optIdx, e.target.value)}
                          onBlur={() => handleSaveForm(form)}
                          className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={() => handleRemoveOption(optIdx)}
                          className="p-1 rounded text-gray-400 hover:text-red-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-xs text-gray-400">
              Select a question to edit settings.
            </div>
          )}
        </div>

        {/* Right Panel - Typeform Live Interactive Preview */}
        <div className="flex-1 bg-gray-100 flex flex-col overflow-hidden relative">
          {/* Device bar controls */}
          <div className="h-10 bg-white border-b border-gray-200 px-4 flex items-center justify-between text-xs text-gray-500 shrink-0">
            <div className="flex items-center gap-2 font-medium">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Live Form Preview</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded transition-all ${
                  previewDevice === 'desktop' ? 'bg-white shadow text-gray-900' : 'hover:text-gray-800'
                }`}
                title="Desktop View"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded transition-all ${
                  previewDevice === 'mobile' ? 'bg-white shadow text-gray-900' : 'hover:text-gray-800'
                }`}
                title="Mobile View"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas container with styled preview */}
          <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
            <div
              className={`transition-all duration-300 shadow-2xl rounded-3xl overflow-hidden flex flex-col ${
                previewDevice === 'mobile' ? 'w-[360px] h-[640px]' : 'w-full max-w-2xl h-[520px]'
              }`}
              style={{
                backgroundColor: form.theme?.backgroundColor || '#191919',
                color: form.theme?.textColor || '#FFFFFF',
              }}
            >
              {/* Typeform Preview Content */}
              <div className="flex-1 p-8 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6 animate-fade-in" key={previewQuestion?.id || 'empty'}>
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest">
                    <span>Question {previewIndex + 1} of {form.questions.length || 1}</span>
                    {previewQuestion?.required && <span className="text-rose-400">*</span>}
                  </div>

                  {previewQuestion ? (
                    <div className="space-y-4">
                      <h2 className="text-2xl md:text-3xl font-bold leading-tight" style={{ color: form.theme?.questionTextColor || '#FFFFFF' }}>
                        {previewQuestion.title}
                      </h2>

                      {previewQuestion.description && (
                        <p className="text-sm text-gray-400 leading-relaxed">
                          {previewQuestion.description}
                        </p>
                      )}

                      {/* Render preview answer input */}
                      <div className="pt-4">
                        {previewQuestion.type === 'short_text' && (
                          <input
                            type="text"
                            placeholder="Type your answer here..."
                            value={previewAnswer}
                            onChange={(e) => setPreviewAnswer(e.target.value)}
                            className="w-full bg-transparent border-b-2 border-blue-500 pb-2 text-xl outline-none"
                            style={{ color: form.theme?.answerTextColor || '#367EE9' }}
                          />
                        )}

                        {previewQuestion.type === 'long_text' && (
                          <textarea
                            placeholder="Type your answer here..."
                            rows={3}
                            value={previewAnswer}
                            onChange={(e) => setPreviewAnswer(e.target.value)}
                            className="w-full bg-transparent border-b-2 border-blue-500 pb-2 text-lg outline-none resize-none"
                            style={{ color: form.theme?.answerTextColor || '#367EE9' }}
                          />
                        )}

                        {previewQuestion.type === 'email' && (
                          <input
                            type="email"
                            placeholder="name@example.com"
                            value={previewAnswer}
                            onChange={(e) => setPreviewAnswer(e.target.value)}
                            className="w-full bg-transparent border-b-2 border-blue-500 pb-2 text-xl outline-none"
                            style={{ color: form.theme?.answerTextColor || '#367EE9' }}
                          />
                        )}

                        {previewQuestion.type === 'number' && (
                          <input
                            type="number"
                            placeholder="0"
                            value={previewAnswer}
                            onChange={(e) => setPreviewAnswer(e.target.value)}
                            className="w-full bg-transparent border-b-2 border-blue-500 pb-2 text-2xl outline-none"
                            style={{ color: form.theme?.answerTextColor || '#367EE9' }}
                          />
                        )}

                        {previewQuestion.type === 'multiple_choice' && (
                          <div className="space-y-2">
                            {(previewQuestion.options || ['Option 1', 'Option 2']).map((opt, i) => (
                              <button
                                key={i}
                                onClick={() => setPreviewAnswer(opt)}
                                className={`w-full text-left px-4 py-3 rounded-xl border flex items-center justify-between transition-all ${
                                  previewAnswer === opt
                                    ? 'border-blue-500 bg-blue-500/20 font-bold'
                                    : 'border-white/20 hover:border-white/40 bg-white/5'
                                }`}
                              >
                                <span>{opt}</span>
                                <span className="text-xs px-2 py-0.5 rounded bg-white/10">{String.fromCharCode(65 + i)}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {previewQuestion.type === 'yes_no' && (
                          <div className="flex items-center gap-4">
                            {['Yes', 'No'].map((opt) => (
                              <button
                                key={opt}
                                onClick={() => setPreviewAnswer(opt)}
                                className={`flex-1 py-4 rounded-xl border text-center font-bold text-lg transition-all ${
                                  previewAnswer === opt
                                    ? 'border-blue-500 bg-blue-500/20'
                                    : 'border-white/20 hover:border-white/40 bg-white/5'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}

                        {previewQuestion.type === 'rating' && (
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setPreviewAnswer(star)}
                                className={`p-3 rounded-xl border transition-all ${
                                  previewAnswer >= star
                                    ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
                                    : 'border-white/20 text-gray-500'
                                }`}
                              >
                                <Star className="w-6 h-6 fill-current" />
                              </button>
                            ))}
                          </div>
                        )}

                        {previewQuestion.type === 'dropdown' && (
                          <select
                            value={previewAnswer}
                            onChange={(e) => setPreviewAnswer(e.target.value)}
                            className="w-full bg-gray-900 border border-white/20 rounded-xl px-4 py-3 text-base text-white focus:outline-none"
                          >
                            <option value="">Select an option...</option>
                            {(previewQuestion.options || []).map((opt, i) => (
                              <option key={i} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400">No questions added yet.</p>
                  )}
                </div>

                {/* Preview navigation footer */}
                <div className="flex items-center justify-between pt-6 border-t border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewIndex((prev) => Math.max(0, prev - 1))}
                      disabled={previewIndex === 0}
                      className="px-3 py-1.5 rounded-lg border border-white/20 disabled:opacity-30 hover:bg-white/10"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setPreviewIndex((prev) => Math.min(form.questions.length - 1, prev + 1))}
                      disabled={previewIndex >= form.questions.length - 1}
                      className="px-3 py-1.5 rounded-lg border border-white/20 disabled:opacity-30 hover:bg-white/10"
                    >
                      Next
                    </button>
                  </div>

                  <span className="text-gray-400">Press Enter ↵ to advance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Question Modal */}
      {isAddQuestionModalOpen && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Choose Question Type</h3>
              <button
                onClick={() => setIsAddQuestionModalOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {QUESTION_TYPES.map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleAddQuestion(item.type)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all group"
                >
                  <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-blue-100 transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 group-hover:text-blue-700">
                      {item.label}
                    </h4>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
