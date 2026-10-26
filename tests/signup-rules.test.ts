import { describe, expect, it } from 'vitest';
import { EMAIL, isAllowed, LISTS, sitePath } from '../supabase/functions/pageteardown-signup/rules.ts';

describe('origins', () => {
  it('allows the site and this project\'s previews', () => {
    expect(isAllowed('https://www.pageteardown.com')).toBe(true);
    expect(isAllowed('https://pageteardown.com')).toBe(true);
    expect(isAllowed('https://pageteardown-abc123xyz-andrewluxemcrm-projects.vercel.app')).toBe(true);
    expect(isAllowed('https://pageteardown-git-feat-watchlist-waitlist-andrewluxemcrm-projects.vercel.app')).toBe(true);
  });
  it('refuses other sites, other projects\' previews and lookalikes', () => {
    expect(isAllowed(null)).toBe(false);
    expect(isAllowed('https://www.inboxteardown.com')).toBe(false);
    expect(isAllowed('https://www.socialteardown.com')).toBe(false);
    expect(isAllowed('https://inboxteardown-abc123-andrewluxemcrm-projects.vercel.app')).toBe(false);
    expect(isAllowed('https://socialteardown-abc123-andrewluxemcrm-projects.vercel.app')).toBe(false);
    expect(isAllowed('http://www.pageteardown.com')).toBe(false);
    expect(isAllowed('https://pageteardown-x-andrewluxemcrm-projects.vercel.app.evil.com')).toBe(false);
    expect(isAllowed('https://evil.com/pageteardown-x-andrewluxemcrm-projects.vercel.app')).toBe(false);
  });
});

describe('lists', () => {
  it('accepts only the Page Teardown Watchlist', () => {
    expect([...LISTS]).toEqual(['page-watchlist']);
  });
});

describe('email', () => {
  it('is loose but needs one @ and a dotted domain', () => {
    expect(EMAIL.test('you@company.com')).toBe(true);
    expect(EMAIL.test('a.b+c@mail.co.uk')).toBe(true);
    expect(EMAIL.test('you@company')).toBe(false);
    expect(EMAIL.test('you @company.com')).toBe(false);
    expect(EMAIL.test('you@@company.com')).toBe(false);
  });
});

describe('source path', () => {
  it('keeps same-site paths only', () => {
    expect(sitePath('/watchlist/')).toBe('/watchlist/');
    expect(sitePath('//evil.com/')).toBeNull();
    expect(sitePath('/watchlist/?x=1')).toBeNull();
    expect(sitePath('https://evil.com/')).toBeNull();
    expect(sitePath(null)).toBeNull();
  });
});
