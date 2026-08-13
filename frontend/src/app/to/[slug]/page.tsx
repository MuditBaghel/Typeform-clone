'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Form } from '@/types';
import { api } from '@/lib/api';
import {
  ChevronUp,
  ChevronDown,
  Check,
  Star,
  AlertCircle,
  Sparkles,
  RotateCcw,
  Play
} from 'lucide-react';

export default function PublicRespondentPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [historyStack, setHistoryStack] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(null);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchPublicForm = async () => {
      try {
        setLoading(true);
        const data = await api.getPublicForm(slug);
        setForm(data);
        if (data.welcome_enabled === false) {
          setHasStarted(true);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Form not found or unpublished.');
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchPublicForm();
  }, [slug]);

  // Focus input on slide transition
  useEffect(() => {
    if (hasStarted && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, hasStarted]);

  const currentQuestion = form?.questions[currentIndex];

  const getNextIndex = (fromIndex: number, currentAnswers: Record<string, any>) => {
    if (!form) return fromIndex + 1;
    const q = form.questions[fromIndex];
    const currentVal = currentAnswers[q.id];

    if (q.logic && q.logic.length > 0 && currentVal) {
      const matchedRule = q.logic.find((rule) => String(rule.ifValue) === String(currentVal));
      if (matchedRule && matchedRule.goToQuestionId) {
        if (matchedRule.goToQuestionId === '__thank_you__') {
          return form.questions.length;
        }
        const targetIdx = form.questions.findIndex((targetQ) => targetQ.id === matchedRule.goToQuestionId);
        if (targetIdx !== -1) {
          return targetIdx;
        }
      }
    }
    return fromIndex + 1;
  };

  const validateCurrentQuestion = (): boolean => {
    if (!currentQuestion) return true;
    const val = answers[currentQuestion.id];
    let err = '';

    if (currentQuestion.required && (val === undefined || val === null || String(val).trim() === '')) {
      err = 'Please fill out this field to continue';
    } else if (currentQuestion.type === 'email' && val) {
      if (!/\S+@\S+\.\S+/.test(String(val))) {
        err = 'Please enter a valid email address';
      }
    } else if (currentQuestion.type === 'number' && val) {
      if (isNaN(Number(val))) {
        err = 'Please enter a valid number';
      }
    }

    setFieldErrors((prev) => ({ ...prev, [currentQuestion.id]: err }));
    return !err;
  };

  const handleNext = () => {
    if (!hasStarted) {
      setHasStarted(true);
      return;
    }
    if (!form) return;
    if (!validateCurrentQuestion()) return;

    const nextIdx = getNextIndex(currentIndex, answers);
    if (nextIdx >= form.questions.length) {
      handleSubmit();
    } else {
      setHistoryStack((prev) => [...prev, currentIndex]);
      setDirection(1);
      setCurrentIndex(nextIdx);
    }
  };

  const handlePrev = () => {
    if (historyStack.length > 0) {
      const prevIdx = historyStack[historyStack.length - 1];
      setHistoryStack((prev) => prev.slice(0, -1));
      setDirection(-1);
      setCurrentIndex(prevIdx);
    } else if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleChoiceSelect = (optionValue: string) => {
    if (!currentQuestion) return;
    const newAnswers = { ...answers, [currentQuestion.id]: optionValue };
    setAnswers(newAnswers);
    setFieldErrors((prev) => ({ ...prev, [currentQuestion.id]: '' }));

    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }

    autoAdvanceTimerRef.current = setTimeout(() => {
      const nextIdx = getNextIndex(currentIndex, newAnswers);
      if (nextIdx >= (form?.questions.length || 0)) {
        handleSubmit(newAnswers);
      } else {
        setHistoryStack((prev) => [...prev, currentIndex]);
        setDirection(1);
        setCurrentIndex(nextIdx);
      }
    }, 220);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!hasStarted) {
      if (e.key === 'Enter') {
        e.preventDefault();
        setHasStarted(true);
      }
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      if (currentQuestion?.type !== 'long_text') {
        e.preventDefault();
        handleNext();
      }
    }

    // Keyboard letter shortcuts
    if (currentQuestion?.type === 'multiple_choice' && currentQuestion.options) {
      const char = e.key.toUpperCase();
      const code = char.charCodeAt(0);
      if (code >= 65 && code < 65 + currentQuestion.options.length) {
        const idx = code - 65;
        const opt = currentQuestion.options[idx];
        if (opt) handleChoiceSelect(opt);
      }
    }

    if (currentQuestion?.type === 'yes_no') {
      const char = e.key.toUpperCase();
      if (char === 'Y') handleChoiceSelect('Yes');
      if (char === 'N') handleChoiceSelect('No');
    }

    if (currentQuestion?.type === 'rating') {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 5) {
        handleChoiceSelect(String(num));
      }
    }
  };

  const handleSubmit = async (finalAnswers?: Record<string, any>) => {
    if (!form || isSubmitting) return;
    setIsSubmitting(true);
    const answersToSend = finalAnswers || answers;

    try {
      await api.submitPublicResponse(slug, answersToSend);
      setIsCompleted(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.55 },
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit response.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div suppressHydrationWarning className="min-h-screen bg-[#191919] flex items-center justify-center text-white">
        <div suppressHydrationWarning className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (errorMsg || !form) {
    return (
      <div className="min-h-screen bg-[#191919] flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-bold">Form Unavailable</h2>
          <p className="text-gray-400 text-sm">{errorMsg || 'This form does not exist or has been unpublished.'}</p>
        </div>
      </div>
    );
  }

  const theme = form.theme || {
    backgroundColor: '#191919',
    textColor: '#FFFFFF',
    buttonColor: '#0445AF',
    buttonTextColor: '#FFFFFF',
    questionTextColor: '#FFFFFF',
    answerTextColor: '#367EE9',
  };

  const totalQuestions = form.questions.length;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  if (isCompleted) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center transition-colors duration-500 font-sans"
        style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="max-w-lg space-y-6"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-xl">
            <Check className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {form.thank_you_title || 'Thank you for taking the time!'}
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed font-light">
            {form.thank_you_description || 'Your responses have been recorded.'}
          </p>

          <div className="pt-6">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-base transition-all duration-200 active:scale-95 shadow-xl hover:opacity-90"
              style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor }}
            >
              <RotateCcw className="w-4 h-4" />
              <span>{form.thank_you_button_text || 'Submit another response'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Welcome screen view
  if (!hasStarted && form.welcome_enabled !== false) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center font-sans select-none"
        style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
        onKeyDown={handleKeyDown}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-xl space-y-6"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#0445AF] flex items-center justify-center text-white font-black text-base mx-auto shadow-lg">
            tf
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            {form.welcome_title || form.title}
          </h1>
          <p className="text-gray-300 text-lg md:text-xl font-light leading-relaxed">
            {form.welcome_description || form.description || 'Please answer the following questions.'}
          </p>

          <div className="pt-6 flex flex-col items-center gap-3">
            <button
              onClick={() => setHasStarted(true)}
              className="px-9 py-4 rounded-full font-bold text-xl flex items-center gap-3 shadow-2xl transition-all duration-200 active:scale-95 hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor }}
            >
              <span>{form.welcome_button_text || 'Start Form'}</span>
              <Play className="w-5 h-5 fill-current" />
            </button>
            <span className="text-xs text-gray-400 font-light">
              press <kbd className="px-2 py-1 bg-white/10 rounded font-mono text-[11px]">Enter ↵</kbd>
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen flex flex-col justify-between font-sans relative overflow-hidden select-none"
      style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Top Progress Bar */}
      <div className="w-full h-1.5 bg-white/10 fixed top-0 left-0 z-50">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: theme.buttonColor || '#0445AF',
          }}
        />
      </div>

      {/* Header bar */}
      <header className="px-8 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-[#0445AF] flex items-center justify-center text-white font-black text-[11px] shadow-sm">
            tf
          </div>
          <span className="text-xs font-semibold tracking-wider opacity-70 uppercase">{form.title}</span>
        </div>

        <span className="text-xs font-mono font-medium text-gray-400">
          {currentIndex + 1} of {totalQuestions} ({progressPercent}%)
        </span>
      </header>

      {/* Main Animated 1-Question Container */}
      <main className="flex-1 flex items-center justify-center px-6 md:px-16 max-w-4xl mx-auto w-full z-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQuestion?.id}
            custom={direction}
            initial={{ opacity: 0, y: direction * 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -direction * 40 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full space-y-8"
          >
            {currentQuestion && (
              <div className="space-y-6">
                {/* Question index & title */}
                <div className="flex items-start gap-4">
                  <span
                    className="text-sm md:text-base font-mono font-bold px-2.5 py-1 rounded-lg bg-white/10 shrink-0 mt-1"
                    style={{ color: theme.buttonColor }}
                  >
                    {currentIndex + 1} →
                  </span>
                  <div className="space-y-2">
                    <h2
                      className="text-2xl md:text-4xl font-extrabold leading-tight tracking-tight"
                      style={{ color: theme.questionTextColor }}
                    >
                      {currentQuestion.title}
                      {currentQuestion.required && <span className="text-rose-400 ml-1.5">*</span>}
                    </h2>
                    {currentQuestion.description && (
                      <p className="text-base md:text-lg text-gray-300 font-light leading-relaxed">
                        {currentQuestion.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Input Fields */}
                <div className="pt-4 pl-0 md:pl-12">
                  {currentQuestion.type === 'short_text' && (
                    <input
                      ref={inputRef as any}
                      type="text"
                      placeholder="Type your answer here..."
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => {
                        setAnswers({ ...answers, [currentQuestion.id]: e.target.value });
                        setFieldErrors({ ...fieldErrors, [currentQuestion.id]: '' });
                      }}
                      className="w-full bg-transparent border-b-2 border-white/30 focus:border-blue-400 pb-3 text-2xl md:text-3xl font-medium outline-none transition-colors"
                      style={{ color: theme.answerTextColor || '#367EE9' }}
                    />
                  )}

                  {currentQuestion.type === 'long_text' && (
                    <textarea
                      ref={inputRef as any}
                      placeholder="Type your answer here..."
                      rows={4}
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => {
                        setAnswers({ ...answers, [currentQuestion.id]: e.target.value });
                        setFieldErrors({ ...fieldErrors, [currentQuestion.id]: '' });
                      }}
                      className="w-full bg-transparent border-b-2 border-white/30 focus:border-blue-400 pb-3 text-xl md:text-2xl font-medium outline-none transition-colors resize-y"
                      style={{ color: theme.answerTextColor || '#367EE9' }}
                    />
                  )}

                  {currentQuestion.type === 'email' && (
                    <input
                      ref={inputRef as any}
                      type="email"
                      placeholder="name@example.com"
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => {
                        setAnswers({ ...answers, [currentQuestion.id]: e.target.value });
                        setFieldErrors({ ...fieldErrors, [currentQuestion.id]: '' });
                      }}
                      className="w-full bg-transparent border-b-2 border-white/30 focus:border-blue-400 pb-3 text-2xl md:text-3xl font-medium outline-none transition-colors"
                      style={{ color: theme.answerTextColor || '#367EE9' }}
                    />
                  )}

                  {currentQuestion.type === 'number' && (
                    <input
                      ref={inputRef as any}
                      type="number"
                      placeholder="0"
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => {
                        setAnswers({ ...answers, [currentQuestion.id]: e.target.value });
                        setFieldErrors({ ...fieldErrors, [currentQuestion.id]: '' });
                      }}
                      className="w-full bg-transparent border-b-2 border-white/30 focus:border-blue-400 pb-3 text-3xl md:text-4xl font-mono font-medium outline-none transition-colors"
                      style={{ color: theme.answerTextColor || '#367EE9' }}
                    />
                  )}

                  {currentQuestion.type === 'multiple_choice' && (
                    <div className="space-y-3 max-w-lg">
                      {(currentQuestion.options || ['Option 1', 'Option 2']).map((opt, i) => {
                        const keyLetter = String.fromCharCode(65 + i);
                        const isSelected = answers[currentQuestion.id] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleChoiceSelect(opt)}
                            className={`w-full text-left px-5 py-4 rounded-2xl border text-lg font-medium flex items-center justify-between transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'border-blue-400 bg-blue-500/20 shadow-lg scale-[1.01]'
                                : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <span>{opt}</span>
                            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white/10 border border-white/20">
                              {keyLetter}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentQuestion.type === 'yes_no' && (
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md">
                      {['Yes', 'No'].map((opt, i) => {
                        const isSelected = answers[currentQuestion.id] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleChoiceSelect(opt)}
                            className={`flex-1 py-5 px-6 rounded-2xl border text-xl font-bold flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'border-blue-400 bg-blue-500/20 shadow-lg scale-[1.02]'
                                : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <span>{opt}</span>
                            <span className="text-xs font-mono px-2.5 py-1 rounded bg-white/10">
                              {i === 0 ? 'Y' : 'N'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentQuestion.type === 'rating' && (
                    <div className="flex items-center gap-3">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isSelected = Number(answers[currentQuestion.id]) >= star;
                        return (
                          <button
                            key={star}
                            onClick={() => handleChoiceSelect(String(star))}
                            className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'border-yellow-400 text-yellow-400 bg-yellow-400/20 scale-110 shadow-lg'
                                : 'border-white/20 text-gray-500 hover:border-white/40 hover:bg-white/5'
                            }`}
                          >
                            <Star className="w-8 h-8 fill-current" />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentQuestion.type === 'dropdown' && (
                    <select
                      ref={inputRef as any}
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => {
                        setAnswers({ ...answers, [currentQuestion.id]: e.target.value });
                        setFieldErrors({ ...fieldErrors, [currentQuestion.id]: '' });
                      }}
                      className="w-full max-w-lg bg-gray-900 border-2 border-white/20 rounded-2xl px-5 py-4 text-xl text-white focus:border-blue-400 outline-none"
                    >
                      <option value="">Choose an option...</option>
                      {(currentQuestion.options || []).map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Validation error msg */}
                  {fieldErrors[currentQuestion.id] && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-rose-400 text-sm font-semibold flex items-center gap-1.5 mt-3"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{fieldErrors[currentQuestion.id]}</span>
                    </motion.p>
                  )}

                  {/* Next / Submit Button */}
                  <div className="pt-8 flex items-center gap-4">
                    <button
                      onClick={handleNext}
                      disabled={isSubmitting}
                      className="px-8 py-3.5 rounded-full font-bold text-lg flex items-center gap-2 shadow-xl transition-all duration-200 active:scale-95 hover:opacity-90 cursor-pointer"
                      style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor }}
                    >
                      <span>{currentIndex === totalQuestions - 1 ? 'Submit' : 'OK'}</span>
                      {currentIndex === totalQuestions - 1 ? (
                        <Sparkles className="w-5 h-5" />
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                    </button>

                    <span className="text-xs text-gray-400 font-light hidden sm:inline">
                      press <kbd className="px-2 py-1 bg-white/10 rounded font-mono text-[11px]">Enter ↵</kbd>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Up/Down Navigation Footer */}
      <footer className="px-8 py-6 flex items-center justify-between z-10 border-t border-white/10">
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0 && historyStack.length === 0}
            className="p-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all cursor-pointer"
            title="Previous question"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === totalQuestions - 1}
            className="p-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all cursor-pointer"
            title="Next question"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-gray-400 flex items-center gap-2">
          <span>Powered by</span>
          <span className="font-bold text-white tracking-wider">Typeform</span>
        </div>
      </footer>
    </div>
  );
}