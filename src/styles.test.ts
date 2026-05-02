/// <reference types="node" />

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const stylesheet = readFileSync(join(process.cwd(), 'src/styles.css'), 'utf8');

describe('responsive stylesheet contracts', () => {
  it('keeps the word-list action hierarchy clear and responsive', () => {
    expect(stylesheet).toMatch(/\.word-action-panel\s*{[^}]*display:\s*grid/s);
    expect(stylesheet).toMatch(/\.word-photo-search-action\s*{[^}]*grid-column:\s*1 \/ -1/s);
    expect(stylesheet).toMatch(/\.word-photo-search-action\s*{[^}]*min-height:\s*46px/s);
    expect(stylesheet).toMatch(
      /@container control-panel \(max-width:\s*360px\)[\s\S]*\.word-action-panel\s*{[^}]*grid-template-columns:\s*1fr/,
    );
  });

  it('lets photo rows reflow inside narrow control-panel containers', () => {
    expect(stylesheet).toMatch(
      /\.keyword-row\s*{[^}]*grid-template-columns:\s*56px minmax\(0,\s*1fr\)/s,
    );
    expect(stylesheet).toMatch(/\.keyword-row\s*{[^}]*container-type:\s*inline-size/s);
    expect(stylesheet).toMatch(/\.image-controls\s*{[^}]*grid-column:\s*1 \/ -1/s);
    expect(stylesheet).toMatch(/@container photo-row \(max-width:\s*320px\)/);
  });

  it('keeps word-search controls simple and responsive', () => {
    expect(stylesheet).toMatch(
      /\.word-search-controls\s*{[^}]*grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\)/s,
    );
    expect(stylesheet).toMatch(/\.stepper-control\s*{[^}]*grid-column:\s*span 3/s);
    expect(stylesheet).toMatch(/\.filler-choice-group\s*{[^}]*grid-column:\s*span 4/s);
    expect(stylesheet).toMatch(/\.filler-choice-grid\s*{[^}]*grid-template-columns:\s*repeat\(3,/s);
    expect(stylesheet).toMatch(
      /@media \(max-width:\s*620px\)[\s\S]*\.word-search-controls,[\s\S]*\.keyword-row\s*{[^}]*grid-template-columns:\s*1fr/,
    );
  });

  it('prevents the image picker modal from overflowing narrow screens', () => {
    expect(stylesheet).toMatch(/\.image-picker-dialog\s*{[^}]*max-inline-size:\s*100%/s);
    expect(stylesheet).toMatch(/\.image-picker-dialog\s*{[^}]*overflow-x:\s*hidden/s);
    expect(stylesheet).toMatch(
      /\.image-result-grid\s*{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*180px\),\s*1fr\)\)/s,
    );
    expect(stylesheet).toMatch(/\.image-result-meta\s*{[^}]*min-width:\s*0/s);
    expect(stylesheet).toMatch(/\.image-result-media\s*{[^}]*aspect-ratio:\s*4 \/ 3/s);
    expect(stylesheet).toMatch(/\.image-result-media\s+img\s*{[^}]*height:\s*100%/s);
    expect(stylesheet).toMatch(/\.image-result-media\s+img\s*{[^}]*object-fit:\s*contain/s);
    expect(stylesheet).toMatch(/@media \(max-width:\s*480px\)/);
    expect(stylesheet).toMatch(
      /@media \(max-width:\s*480px\)[\s\S]*\.image-result-card\s*{[^}]*grid-template-columns:\s*88px minmax\(0,\s*1fr\)/,
    );
  });
});
