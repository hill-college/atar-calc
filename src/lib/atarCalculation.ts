import { Subject, SubjectScore } from './supabase';

export function calculateScaledScore(rawScore: number, scalingFactor: number): number {
  return Math.round(rawScore * scalingFactor * 100) / 100;
}

export function calculateATAR(subjectScores: SubjectScore[]): number {
  if (subjectScores.length < 4) {
    return 0;
  }

  const sortedScores = [...subjectScores]
    .map(ss => ({
      ...ss,
      scaledScore: calculateScaledScore(ss.rawScore, ss.subject.scaling_factor)
    }))
    .sort((a, b) => b.scaledScore - a.scaledScore);

  const top4 = sortedScores.slice(0, 4);
  let aggregate = top4.reduce((sum, ss) => sum + ss.scaledScore, 0);

  const mathsSubjects = subjectScores.filter(ss =>
    ss.subject.name === 'Mathematics Methods' ||
    ss.subject.name === 'Mathematics Specialist'
  );

  mathsSubjects.forEach(ss => {
    const scaled = calculateScaledScore(ss.rawScore, ss.subject.scaling_factor);
    aggregate += scaled * 0.1;
  });

  const loteSubjects = subjectScores.filter(ss =>
    ss.subject.category === 'Languages'
  );

  loteSubjects.forEach(ss => {
    const scaled = calculateScaledScore(ss.rawScore, ss.subject.scaling_factor);
    aggregate += scaled * 0.1;
  });

  const maxAggregate = 400 + (mathsSubjects.length * 10) + (loteSubjects.length * 10);
  const percentile = (aggregate / maxAggregate) * 100;

  const atar = Math.min(99.95, Math.max(0, percentile * 0.9995));

  return Math.round(atar * 100) / 100;
}

export function getSubjectRecommendations(yearLevel: string): string[] {
  if (yearLevel === 'Year 10') {
    return [
      'Consider Mathematics Methods or Specialist for strong scaling',
      'Choose at least one science (Physics/Chemistry scale best)',
      'English ATAR or Literature is required',
      'Select subjects you enjoy and can perform well in'
    ];
  }

  return [
    'You need at least 4 ATAR subjects',
    'Top 4 subjects count toward your ATAR',
    'Mathematics and LOTE subjects receive 10% bonus points',
    'Focus on maintaining strong raw scores'
  ];
}
