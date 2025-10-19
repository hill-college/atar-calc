import { SubjectScore } from '../lib/supabase';
import { calculateScaledScore } from '../lib/atarCalculation';
import { TrendingUp, Award, Info } from 'lucide-react';

interface ATARDisplayProps {
  atar: number;
  subjectScores: SubjectScore[];
  yearLevel: string;
}

export default function ATARDisplay({ atar, subjectScores, yearLevel }: ATARDisplayProps) {
  if (subjectScores.length < 4) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <Info className="mx-auto mb-3 text-blue-600" size={32} />
        <p className="text-blue-900 font-medium">
          Add at least 4 subjects to calculate your ATAR
        </p>
        <p className="text-blue-700 text-sm mt-2">
          You need a minimum of 4 ATAR subjects for your calculation
        </p>
      </div>
    );
  }

  const sortedScores = [...subjectScores]
    .map(ss => ({
      ...ss,
      scaledScore: calculateScaledScore(ss.rawScore, ss.subject.scaling_factor)
    }))
    .sort((a, b) => b.scaledScore - a.scaledScore);

  const top4 = sortedScores.slice(0, 4);
  const bonusSubjects = subjectScores.filter(ss => ss.subject.has_bonus);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Your Predicted ATAR</h2>
          <Award size={32} />
        </div>

        <div className="text-6xl font-bold mb-2">
          {atar.toFixed(2)}
        </div>

        <p className="text-blue-100">
          {yearLevel === 'Year 10'
            ? 'Based on predicted Year 12 performance'
            : 'Based on your current/predicted scores'}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-600" />
          Top 4 Contributing Subjects
        </h3>

        <div className="space-y-3">
          {top4.map((ss, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{ss.subject.name}</p>
                <p className="text-sm text-gray-500">
                  Raw Score: {ss.rawScore.toFixed(1)} → Scaled: {ss.scaledScore.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-blue-600">
                  {ss.scaledScore.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  Scaling: {ss.subject.scaling_factor.toFixed(2)}x
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {bonusSubjects.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center gap-2">
            ⭐ Bonus Points Applied
          </h3>
          <div className="space-y-2">
            {bonusSubjects.map((ss, index) => {
              const scaled = calculateScaledScore(ss.rawScore, ss.subject.scaling_factor);
              const bonus = scaled * 0.1;
              return (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-yellow-900">{ss.subject.name}</span>
                  <span className="font-medium text-yellow-700">+{bonus.toFixed(2)} points</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-yellow-700 mt-3">
            Mathematics and LOTE subjects receive 10% bonus points added to your aggregate
          </p>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Important Notes</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• This is an estimate based on historical scaling data</li>
          <li>• Actual ATAR depends on the cohort strength each year</li>
          <li>• Subject scaling can vary year to year</li>
          <li>• Your school marks and WACE exam results both contribute 50%</li>
        </ul>
      </div>
    </div>
  );
}
