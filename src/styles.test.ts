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

  it('treats word-search hint images as primary learning material', () => {
    expect(stylesheet).toMatch(
      /\.hint-grid\s*{[^}]*grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(176px,\s*1fr\)\)/s,
    );
    expect(stylesheet).toMatch(/\.hint-item\s*{[^}]*grid-template-columns:\s*1fr/s);
    expect(stylesheet).toMatch(
      /\.hint-item \.image-preview,[\s\S]*\.hint-item \.image-placeholder\s*{[^}]*height:\s*132px/s,
    );
    expect(stylesheet).toMatch(/\.hint-item \.image-preview\s*{[^}]*object-fit:\s*contain/s);
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

  it('keeps output actions sticky with room for a readiness summary', () => {
    expect(stylesheet).toMatch(/\.action-bar\s*{[^}]*position:\s*sticky/s);
    expect(stylesheet).toMatch(/\.action-bar\s*{[^}]*bottom:\s*0/s);
    expect(stylesheet).toMatch(/\.action-bar\s*{[^}]*display:\s*flex/s);
    expect(stylesheet).toMatch(/\.action-summary\s*{[^}]*overflow-wrap:\s*anywhere/s);
    expect(stylesheet).toMatch(/\.action-disabled-reason\s*{[^}]*overflow-wrap:\s*anywhere/s);
    expect(stylesheet).toMatch(
      /@media \(max-width:\s*620px\)[\s\S]*\.action-buttons\s*{[^}]*grid-template-columns:\s*1fr/s,
    );
  });

  it('gives dobble cards enough preview area for image recognition', () => {
    expect(stylesheet).toMatch(
      /\.dobble-grid\s*{[^}]*grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(min\(100%,\s*320px\),\s*1fr\)\)/s,
    );
    expect(stylesheet).toMatch(/\.dobble-card-preview\s*{[^}]*width:\s*min\(100%,\s*320px\)/s);
  });

  it('opens the word drawer from the right edge', () => {
    expect(stylesheet).toMatch(/\.word-drawer\s*{[^}]*right:\s*0/s);
    expect(stylesheet).toMatch(
      /\.word-drawer\s*{[^}]*transform:\s*translateX\(calc\(100% \+ 28px\)\)/s,
    );
    expect(stylesheet).toMatch(/\.word-drawer-scrim\s*{[^}]*position:\s*fixed/s);
  });

  it('keeps the word drawer header visible while scrolling', () => {
    expect(stylesheet).toMatch(
      /\.word-drawer \.word-setup-panel-drawer > \.panel-heading\s*{[^}]*position:\s*sticky/s,
    );
    expect(stylesheet).toMatch(
      /\.word-drawer \.word-setup-panel-drawer > \.panel-heading\s*{[^}]*top:\s*0/s,
    );
    expect(stylesheet).toMatch(
      /\.word-drawer \.word-setup-panel-drawer > \.panel-heading\s*{[^}]*z-index:\s*1/s,
    );
    expect(stylesheet).toMatch(
      /\.word-drawer \.word-setup-panel-drawer > \.panel-heading\s*{[^}]*margin:\s*-18px -18px 0/s,
    );
    expect(stylesheet).toMatch(
      /\.word-drawer \.word-setup-panel-drawer > \.panel-heading\s*{[^}]*padding:\s*24px 18px 12px/s,
    );
  });

  it('keeps dobble rail content visually flat instead of nesting cards', () => {
    expect(stylesheet).toMatch(
      /\.material-settings-rail \.dobble-plan-panel\s*{[^}]*padding:\s*0/s,
    );
    expect(stylesheet).toMatch(/\.material-settings-rail \.dobble-plan-panel\s*{[^}]*border:\s*0/s);
    expect(stylesheet).toMatch(
      /\.material-settings-rail \.dobble-plan-panel\s*{[^}]*background:\s*transparent/s,
    );
    expect(stylesheet).toMatch(
      /\.material-settings-rail \.dobble-display-controls\s*{[^}]*background:\s*transparent/s,
    );
    expect(stylesheet).toMatch(
      /\.material-settings-rail \.dobble-display-controls\s*{[^}]*box-shadow:\s*none/s,
    );
    expect(stylesheet).toMatch(
      /\.material-settings-rail \.dobble-display-controls \.option-card-button\s*{[^}]*display:\s*flex/s,
    );
    expect(stylesheet).toMatch(
      /\.material-settings-rail \.dobble-display-controls \.option-card-button\s*{[^}]*align-items:\s*center/s,
    );
    expect(stylesheet).toMatch(
      /\.material-settings-rail \.dobble-display-controls \.option-card-button\s*{[^}]*justify-content:\s*center/s,
    );
  });

  it('groups compact output actions in the preview header', () => {
    expect(stylesheet).toMatch(
      /\.material-preview-toolbar \.action-bar\[data-variant='inline'\]\s*{[^}]*width:\s*auto/s,
    );
    expect(stylesheet).toMatch(
      /\.material-preview-toolbar \.action-bar\[data-variant='inline'\]\s*{[^}]*padding-top:\s*0/s,
    );
    expect(stylesheet).toMatch(
      /\.material-preview-toolbar \.action-bar\[data-variant='inline'\]\s*{[^}]*display:\s*grid/s,
    );
    expect(stylesheet).toMatch(
      /\.material-preview-toolbar \.action-bar\[data-variant='inline'\] \.action-buttons\s*{[^}]*display:\s*flex/s,
    );
    expect(stylesheet).toMatch(
      /\.material-preview-toolbar \.action-bar\[data-variant='inline'\] \.action-buttons\s*{[^}]*justify-content:\s*flex-end/s,
    );
    expect(stylesheet).toMatch(
      /\.material-preview-toolbar \.action-bar\[data-variant='inline'\] \.secondary-button,[\s\S]*\.material-preview-toolbar \.action-bar\[data-variant='inline'\] \.primary-button\s*{[^}]*min-height:\s*44px/s,
    );
    expect(stylesheet).toMatch(
      /\.material-preview-toolbar \.action-bar\[data-variant='inline'\] \.secondary-button,[\s\S]*\.material-preview-toolbar \.action-bar\[data-variant='inline'\] \.primary-button\s*{[^}]*width:\s*auto/s,
    );
    expect(stylesheet).toMatch(
      /\.material-preview-toolbar \.action-bar\[data-variant='inline'\] \.secondary-button,[\s\S]*\.material-preview-toolbar \.action-bar\[data-variant='inline'\] \.primary-button\s*{[^}]*padding:\s*0 12px/s,
    );
  });

  it('stacks word preparation panel headers on narrow screens', () => {
    expect(stylesheet).toMatch(
      /@media \(max-width:\s*620px\)[\s\S]*\.word-prep-panel-heading\s*{[^}]*flex-direction:\s*column/s,
    );
    expect(stylesheet).toMatch(
      /@media \(max-width:\s*620px\)[\s\S]*\.word-prep-panel-heading > \.primary-button,[\s\S]*\.word-prep-panel-heading > \.secondary-button\s*{[^}]*width:\s*100%/s,
    );
  });

  it('shows material readiness as a compact rail status', () => {
    expect(stylesheet).toMatch(/\.material-readiness\s*{[^}]*font-size:\s*12px/s);
    expect(stylesheet).toMatch(/\.material-readiness\s*{[^}]*overflow-wrap:\s*anywhere/s);
  });

  it('uses distinct dobble status tones for opportunity, caution, and blocking states', () => {
    expect(stylesheet).toMatch(
      /\.dobble-plan-alerts span\[data-tone='opportunity'\]\s*{[^}]*color:\s*#a16207/s,
    );
    expect(stylesheet).toMatch(
      /\.dobble-plan-alerts span\[data-tone='caution'\]\s*{[^}]*color:\s*#c2410c/s,
    );
    expect(stylesheet).toMatch(
      /\.dobble-title-row > span\[data-tone='danger'\]\s*{[^}]*color:\s*#9f2d25/s,
    );
  });

  it('splits material-page scrolling between the settings rail and preview panel', () => {
    expect(stylesheet).toMatch(
      /@media \(min-width:\s*981px\)[\s\S]*html\[data-app-route='material'\],[\s\S]*html\[data-app-route='material'\] body,[\s\S]*html\[data-app-route='material'\] #root\s*{[^}]*overflow:\s*hidden/s,
    );
    expect(stylesheet).toMatch(
      /@media \(min-width:\s*981px\)[\s\S]*html\[data-app-route='material'\] \.app-shell\s*{[^}]*grid-template-rows:\s*auto minmax\(0,\s*1fr\)/s,
    );
    expect(stylesheet).toMatch(
      /@media \(min-width:\s*981px\)[\s\S]*html\[data-app-route='material'\] \.app-shell\s*{[^}]*height:\s*100dvh/s,
    );
    expect(stylesheet).toMatch(/\.material-workspace\s*{[^}]*padding:\s*24px 0/s);
    expect(stylesheet).toMatch(/\.material-workspace\s*{[^}]*overflow:\s*hidden/s);
    expect(stylesheet).toMatch(/\.material-workspace\s*{[^}]*align-items:\s*stretch/s);
    expect(stylesheet).toMatch(/\.material-settings-rail\s*{[^}]*max-height:\s*100%/s);
    expect(stylesheet).toMatch(/\.material-settings-rail\s*{[^}]*overflow-y:\s*auto/s);
    expect(stylesheet).toMatch(/\.material-settings-rail\s*{[^}]*overscroll-behavior:\s*contain/s);
    expect(stylesheet).toMatch(/\.tool-panel\s*{[^}]*max-height:\s*100%/s);
    expect(stylesheet).toMatch(/\.tool-panel\s*{[^}]*overflow-y:\s*auto/s);
    expect(stylesheet).toMatch(/\.tool-panel\s*{[^}]*overscroll-behavior:\s*contain/s);
    expect(stylesheet).toMatch(
      /@media \(max-width:\s*980px\)[\s\S]*\.material-workspace\s*{[^}]*overflow:\s*visible/s,
    );
  });

  it('keeps sheet preview headers compact', () => {
    expect(stylesheet).toMatch(/\.sheet-meta\s*{[^}]*align-items:\s*center/s);
    expect(stylesheet).toMatch(/\.sheet-meta\s*{[^}]*padding-bottom:\s*12px/s);
    expect(stylesheet).toMatch(/\.sheet-title-row\s*{[^}]*display:\s*flex/s);
    expect(stylesheet).toMatch(/\.sheet-title-row\s*{[^}]*align-items:\s*baseline/s);
    expect(stylesheet).toMatch(/\.sheet-meta h3\s*{[^}]*font-size:\s*22px/s);
    expect(stylesheet).toMatch(/\.student-info\s*{[^}]*display:\s*inline-flex/s);
    expect(stylesheet).toMatch(/\.student-info\s*{[^}]*white-space:\s*nowrap/s);
  });

  it('places compact output actions inside the preview header', () => {
    expect(stylesheet).toMatch(/\.material-preview-toolbar\s*{[^}]*position:\s*sticky/s);
    expect(stylesheet).toMatch(/\.material-preview-toolbar\s*{[^}]*top:\s*0/s);
    expect(stylesheet).toMatch(/\.material-preview-toolbar\s*{[^}]*display:\s*flex/s);
    expect(stylesheet).toMatch(
      /\.material-preview-toolbar\s*{[^}]*justify-content:\s*space-between/s,
    );
    expect(stylesheet).toMatch(
      /\.material-preview-toolbar \.action-bar\[data-variant='inline'\]\s*{[^}]*width:\s*auto/s,
    );
    expect(stylesheet).toMatch(
      /\.material-preview-toolbar \.action-bar\[data-variant='inline'\]\s*{[^}]*padding-top:\s*0/s,
    );
    expect(stylesheet).toMatch(
      /\.material-preview-toolbar \.action-bar\[data-variant='inline'\]\s*{[^}]*border-top:\s*0/s,
    );
  });
});
