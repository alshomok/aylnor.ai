// Advanced Matching Algorithm for File Search
// Implements weighted scoring with multiple factors

interface FileMatch {
  id: string;
  filename: string;
  description: string;
  extracted_text: string;
  created_at: string;
}

interface MatchResult {
  file: FileMatch;
  score: number;
  reasons: string[];
}

export function calculateMatchScore(query: string, file: FileMatch): MatchResult {
  let score = 0;
  const reasons: string[] = [];
  
  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/[\s\W]+/).filter(k => k.length > 2);
  
  // Weight 3: Filename match
  const filenameLower = file.filename.toLowerCase();
  keywords.forEach(keyword => {
    if (filenameLower.includes(keyword)) {
      score += 30;
      reasons.push(`تطابق في اسم الملف: "${keyword}"`);
    }
  });
  
  // Weight 2: Description match
  const descriptionLower = (file.description || '').toLowerCase();
  keywords.forEach(keyword => {
    if (descriptionLower.includes(keyword)) {
      score += 20;
      reasons.push(`تطابق في الوصف: "${keyword}"`);
    }
  });
  
  // Weight 1: Extracted text match
  const textLower = file.extracted_text.toLowerCase();
  keywords.forEach(keyword => {
    if (textLower.includes(keyword)) {
      score += 10;
      reasons.push(`تطابق في المحتوى: "${keyword}"`);
    }
  });
  
  // Boost for exact phrase matches
  if (filenameLower.includes(queryLower)) {
    score += 40;
    reasons.push('تطابق كامل لاسم الملف');
  }
  
  if (descriptionLower.includes(queryLower)) {
    score += 25;
    reasons.push('تطابق كامل للوصف');
  }
  
  // Boost recently added files (within 7 days)
  const daysSince = (Date.now() - new Date(file.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince < 7) {
    score += 15;
    reasons.push('ملف حديث (أقل من أسبوع)');
  }
  
  // Boost for PDF files (more likely to be study sheets)
  if (filenameLower.includes('.pdf')) {
    score += 5;
    reasons.push('ملف PDF (شيت دراسي)');
  }
  
  // Penalty for very old files (more than 6 months)
  if (daysSince > 180) {
    score -= 10;
    reasons.push('ملف قديم (أكثر من 6 أشهر)');
  }
  
  // Normalize score to 0-100
  score = Math.max(0, Math.min(100, score));
  
  return {
    file,
    score,
    reasons,
  };
}

export function findBestMatch(query: string, files: FileMatch[]): MatchResult | null {
  if (!files || files.length === 0) {
    return null;
  }
  
  const results = files.map(file => calculateMatchScore(query, file));
  
  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  
  // Return best match if score > 40
  const bestMatch = results[0];
  if (bestMatch.score > 40) {
    return bestMatch;
  }
  
  return null;
}

export function findTopMatches(query: string, files: FileMatch[], limit: number = 5): MatchResult[] {
  if (!files || files.length === 0) {
    return [];
  }
  
  const results = files.map(file => calculateMatchScore(query, file));
  
  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  
  // Return top matches with score > 30
  return results.filter(r => r.score > 30).slice(0, limit);
}
