import { useState, useEffect } from 'react';
import { Calculator, BookOpen, Save, FileDown } from 'lucide-react';
import { supabase, Subject, SubjectScore } from './lib/supabase';
import { calculateATAR, getSubjectRecommendations } from './lib/atarCalculation';
import { exportToPDF } from './lib/pdfExport';
import SubjectSelector from './components/SubjectSelector';
import ATARDisplay from './components/ATARDisplay';

function App() {
  const [yearLevel, setYearLevel] = useState<'Year 10' | 'Year 11' | 'Year 12'>('Year 11');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectScore[]>([]);
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = (subject: Subject, score: number) => {
    setSelectedSubjects([...selectedSubjects, { subject, rawScore: score, scaledScore: 0 }]);
  };

  const handleRemoveSubject = (index: number) => {
    setSelectedSubjects(selectedSubjects.filter((_, i) => i !== index));
  };

  const handleUpdateScore = (index: number, score: number) => {
    const updated = [...selectedSubjects];
    updated[index].rawScore = score;
    setSelectedSubjects(updated);
  };

  const handleSave = async () => {
    if (selectedSubjects.length < 4) return;

    setSaving(true);
    try {
      const atar = calculateATAR(selectedSubjects);

      const { data: calculation, error: calcError } = await supabase
        .from('calculations')
        .insert({
          student_name: studentName || null,
          year_level: yearLevel,
          predicted_atar: atar
        })
        .select()
        .single();

      if (calcError) throw calcError;

      const calculationSubjects = selectedSubjects.map(ss => ({
        calculation_id: calculation.id,
        subject_id: ss.subject.id,
        raw_score: ss.rawScore,
        scaled_score: ss.rawScore * ss.subject.scaling_factor
      }));

      const { error: subjectsError } = await supabase
        .from('calculation_subjects')
        .insert(calculationSubjects);

      if (subjectsError) throw subjectsError;

      alert('Calculation saved successfully!');
    } catch (error) {
      console.error('Error saving calculation:', error);
      alert('Failed to save calculation');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (selectedSubjects.length < 4) return;

    setExporting(true);
    try {
      await exportToPDF(atar, selectedSubjects, yearLevel, studentName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const atar = selectedSubjects.length >= 4 ? calculateATAR(selectedSubjects) : 0;
  const recommendations = getSubjectRecommendations(yearLevel);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Calculator className="mx-auto mb-4 text-blue-600 animate-pulse" size={48} />
          <p className="text-gray-600">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calculator className="text-blue-600" size={48} />
            <h1 className="text-4xl font-bold text-gray-900">
              WACE ATAR Calculator
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Calculate your predicted ATAR score for Western Australian Certificate of Education
          </p>
        </header>

        <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Name (Optional)
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year Level
              </label>
              <div className="flex gap-2">
                {(['Year 10', 'Year 11', 'Year 12'] as const).map((year) => (
                  <button
                    key={year}
                    onClick={() => setYearLevel(year)}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      yearLevel === year
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <BookOpen size={20} />
            Recommendations for {yearLevel}
          </h3>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="text-blue-800 text-sm">
                {rec}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <SubjectSelector
              subjects={subjects}
              selectedSubjects={selectedSubjects}
              onAddSubject={handleAddSubject}
              onRemoveSubject={handleRemoveSubject}
              onUpdateScore={handleUpdateScore}
            />
          </div>

          <div>
            <ATARDisplay
              atar={atar}
              subjectScores={selectedSubjects}
              yearLevel={yearLevel}
            />

            {selectedSubjects.length >= 4 && (
              <div className="space-y-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Save size={20} />
                  {saving ? 'Saving...' : 'Save Calculation'}
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={exporting}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <FileDown size={20} />
                  {exporting ? 'Exporting...' : 'Export to PDF'}
                </button>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-16 text-center text-sm text-gray-500">
          <p>
            ATAR calculations are estimates based on historical scaling data. Actual results may vary.
          </p>
          <p className="mt-2">
            For official information, visit the{' '}
            <a
              href="https://www.scsa.wa.edu.au/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              School Curriculum and Standards Authority
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
