'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Question, QuestionType } from '@/types';
import {
  GripVertical,
  Type,
  AlignLeft,
  List,
  ChevronDown,
  Mail,
  Hash,
  ToggleLeft,
  Star,
  Trash2,
  Copy
} from 'lucide-react';

interface Props {
  question: Question;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const QUESTION_ICONS: Record<QuestionType, React.ReactNode> = {
  short_text: <Type className="w-4 h-4 text-blue-500" />,
  long_text: <AlignLeft className="w-4 h-4 text-purple-500" />,
  multiple_choice: <List className="w-4 h-4 text-emerald-500" />,
  dropdown: <ChevronDown className="w-4 h-4 text-amber-500" />,
  email: <Mail className="w-4 h-4 text-rose-500" />,
  number: <Hash className="w-4 h-4 text-indigo-500" />,
  yes_no: <ToggleLeft className="w-4 h-4 text-cyan-500" />,
  rating: <Star className="w-4 h-4 text-yellow-500" />,
};

export function SortableQuestionItem({
  question,
  index,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
        isSelected
          ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-1 ring-blue-500'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 rounded"
          title="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <span className="text-xs font-bold text-gray-400 w-4 text-right">{index + 1}</span>

        <div className="p-1.5 rounded-lg bg-gray-100 shrink-0">
          {QUESTION_ICONS[question.type]}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-semibold text-gray-800 truncate">
            {question.title || 'Untitled question'}
          </h4>
          <span className="text-[10px] text-gray-400 capitalize">
            {question.type.replace('_', ' ')} {question.required && '• Required'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800"
          title="Duplicate"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded hover:bg-red-100 text-gray-500 hover:text-red-600"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
