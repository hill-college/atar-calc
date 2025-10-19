import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Subject, SubjectScore } from '../lib/supabase';

interface SubjectSelectorProps {
  subjects: Subject[];
  selectedSubjects: SubjectScore[];
  onAddSubject: (subject: Subject, score: number) => void;
  onRemoveSubject: (index: number) => void;
  onUpdateScore: (index: number, score: number) => void;
}

export default function SubjectSelector({
  subjects,
  selectedSubjects,
  onAddSubject,
  onRemoveSubject,
  onUpdateScore
}: SubjectSelectorProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [score, setScore] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['All', ...new Set(subjects.map(s => s.category))];

  const filteredSubjects = categoryFilter === 'All'
    ? subjects
    : subjects.filter(s => s.category === categoryFilter);

  const availableSubjects = filteredSubjects.filter(
    s => !selectedSubjects.some(ss => ss.subject.id === s.id)
  );

  const handleAdd = () => {
    const subject = subjects.find(s => s.id === selectedSubjectId);
    const scoreNum = parseFloat(score);

    if (subject && scoreNum >= 0 && scoreNum <= 100) {
      onAddSubject(subject, scoreNum);
      setSelectedSubjectId('');
      setScore('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Subject</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a subject...</option>
              {availableSubjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} {subject.has_bonus ? '⭐' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Predicted/Actual Score (0-100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="Enter score"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleAdd}
            disabled={!selectedSubjectId || !score}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Add Subject
          </button>
        </div>
      </div>

      {selectedSubjects.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Selected Subjects ({selectedSubjects.length})
          </h3>

          <div className="space-y-3">
            {selectedSubjects.map((ss, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{ss.subject.name}</p>
                    {ss.subject.has_bonus && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        +10% Bonus
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{ss.subject.category}</p>
                </div>

                <input
                  type="number"
                  min="0"
                  max="100"
                  value={ss.rawScore}
                  onChange={(e) => onUpdateScore(index, parseFloat(e.target.value))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <button
                  onClick={() => onRemoveSubject(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
