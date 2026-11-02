import { SaathyArtifactSchema, type SaathyArtifact } from '../../../../packages/contracts/src/ask.ts';

// Adapted from Dhruv's trailing saathy metadata parser. Partial/malformed blocks
// are stripped as well, so JSON and model-supplied answer keys never flash in chat.
export function parseSaathyArtifacts(output: string) {
  const start = output.search(/```saathy\b/i);
  if (start < 0) return { text: output, artifacts: [] as SaathyArtifact[] };
  const text = output.slice(0, start).trim();
  const block = output.slice(start).match(/^```saathy\s*([\s\S]*?)```/i);
  if (!block) return { text, artifacts: [] as SaathyArtifact[] };
  try {
    const meta: unknown = JSON.parse(block[1]!);
    const candidates = meta && typeof meta === 'object' && 'artifacts' in meta ? meta.artifacts : [];
    const artifacts = Array.isArray(candidates) ? candidates.slice(0, 4).flatMap((value) => {
      const parsed = SaathyArtifactSchema.safeParse(value);
      return parsed.success ? [parsed.data] : [];
    }) : [];
    return { text, artifacts };
  } catch { return { text, artifacts: [] as SaathyArtifact[] }; }
}

export const ARTIFACT_PROMPT = `When useful, append a single fenced saathy JSON block with {"artifacts":[...]}. Allowed cards: {"type":"explanation","title":"...","body":"..."}, {"type":"worked-example","title":"...","steps":["..."]}, {"type":"notes","title":"...","points":["..."]}, {"type":"diagram","title":"...","nodes":["..."]}. Use only facts grounded in the supplied sources. Diagrams are ordered labelled steps. No HTML, answer keys, quiz metadata or invented sources. At most four cards. Keep ordinary teaching prose before the block.`;
export const INTERACTIVE_ARTIFACT_PROMPT = `Interactive cards may also use {"type":"chart","title":"...","chart":{"kind":"line","xLabel":"...","yLabel":"...","series":[{"name":"...","points":[{"x":0,"y":0}]}]}} with numbers explicitly supplied in the sources/question, never invented measurements. For a grounded NCERT concept use {"type":"demo","title":"...","demo":{"widget":"motion","prompt":"..."}}. Widgets: numberline, parabola, apline, dice, pythag, linegraph, timeline, motion, wave, atom, angles, fraction, market, pyramid. Timeline needs events [{"when":"...","what":"..."}] taken from supplied sources. Demos are illustrations, never assessed answers. No markup or code in parameters.`;
