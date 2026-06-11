
/**
 * Utility to parse AI responses containing <TAGS> into structured compartments.
 */
export const parseCompartments = (content: string): Record<string, string> => {
  const sections: Record<string, string> = {};
  const tags = ['STANDPUNT', 'ANALYSE', 'NUANCE', 'ADVIES'];

  tags.forEach(tag => {
    // Match both <TAG>...</TAG> and **TAG**:...\n patterns for robustness
    const xmlRegex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i');
    const xmlMatch = content.match(xmlRegex);
    if (xmlMatch?.[1]) {
      sections[tag] = xmlMatch[1].trim();
      return;
    }
    // Fallback: match markdown-style **STANDPUNT**: ... up to next section or end
    const mdRegex = new RegExp(`\\*\\*${tag}\\*\\*:?\\s*([\\s\\S]*?)(?=\\*\\*(?:STANDPUNT|ANALYSE|NUANCE|ADVIES)\\*\\*|$)`, 'i');
    const mdMatch = content.match(mdRegex);
    if (mdMatch?.[1]?.trim()) {
      sections[tag] = mdMatch[1].trim();
    }
  });

  // Fallback: if no recognised tags found at all, split content into the four sections
  // so there's always something to show in the CompositionStage.
  if (Object.keys(sections).length === 0 && content.trim()) {
    const sentences = content.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
    const quarter = Math.max(1, Math.floor(sentences.length / 4));
    sections['STANDPUNT'] = sentences.slice(0, quarter).join(' ');
    sections['ANALYSE']   = sentences.slice(quarter, quarter * 2).join(' ') || sentences.slice(quarter).join(' ');
    sections['NUANCE']    = sentences.slice(quarter * 2, quarter * 3).join(' ') || '';
    sections['ADVIES']    = sentences.slice(quarter * 3).join(' ') || '';
    // Remove empty sections
    Object.keys(sections).forEach(k => { if (!sections[k]) delete sections[k]; });
  }

  return sections;
};
