import type { Fiber, ProductEthics } from '../types';

export const FIBERS: Record<Fiber, string> = {
  cotton: 'cotton',
  wool: 'wool',
  linen: 'linen',
  polyester: 'polyester',
  elastane: 'elastane',
  viscose: 'viscose',
  nylon: 'nylon',
};

export const ETHICS_LABELS: Record<keyof ProductEthics, string> = {
  fairTrade: 'fair trade',
  organic: 'organic',
  recycled: 'recycled',
};

/** Infer fibres from a material label (demo catalogue; EN/DE keywords). */
export function inferFibers(material: string): Fiber[] {
  const m = material.toLowerCase();
  const out = new Set<Fiber>();
  if (/(baumwolle|cotton|pima|bio-baumwolle|oxford|popelin|twill|canvas|ripstop|jersey|selvedge)/.test(m)) out.add('cotton');
  if (/(schurwolle|wolle|wool)/.test(m)) out.add('wool');
  if (/(leinen|linen)/.test(m)) out.add('linen');
  if (/polyester/.test(m)) out.add('polyester');
  if (/(elastan|elasthan)/.test(m)) out.add('elastane');
  if (/viskose/.test(m)) out.add('viscose');
  if (/nylon/.test(m)) out.add('nylon');
  return out.size ? [...out] : ['cotton'];
}

export function isBlend(fibers: Fiber[]): boolean {
  return fibers.length >= 2;
}