import { describe, expect, it } from 'vitest';
import {
  checkAndrewAnywhere,
  checkAndrewMarkers,
  checkDraftNoindex,
  checkFixtureBrands,
  checkFixtureContent,
  checkFooterContact,
  checkOgImages,
  checkPlaceholders,
  pageCopyBrackets,
  checkPrivacyPage,
  checkRobots,
  checkScriptHosts,
  checkSignupEndpoint,
  checkTodos,
  isAllowedScriptSrc,
  scriptSrcs,
  thirdPartyScripts,
} from '../scripts/prelaunch-rules.ts';
import { SITE } from '../src/config/site.ts';

const HOST = 'www.pageteardown.com';
const SITE_URL = `https://${HOST}`;
// The footer rule checks the configured contact address.
const EMAIL = SITE.contactEmail;
const page = (path: string, html: string) => ({ path, html });

describe('script hosts', () => {
  it('allows same-site scripts, including the Vercel insights path', () => {
    for (const src of ['/_astro/page.js', '_astro/page.js', '/_vercel/insights/script.js', `${SITE_URL}/x.js`]) {
      expect(isAllowedScriptSrc(src, HOST), src).toBe(true);
    }
  });
  it('rejects other hosts, the apex domain, protocol-relative URLs, and data: sources', () => {
    for (const src of [
      'https://va.vercel-scripts.com/v1/script.js',
      'https://pageteardown.com/x.js',
      '//cdn.example.com/x.js',
      'https://www.pageteardown.com.evil.io/x.js',
      'data:text/javascript,alert(1)',
    ]) {
      expect(isAllowedScriptSrc(src, HOST), src).toBe(false);
    }
  });
  it('finds src values in any quoting style and ignores inline scripts', () => {
    const html = `<script type="module">inline()</script><script src="/a.js"></script><script defer src='https://x.io/b.js'></script><script src=//y.io/c.js></script>`;
    expect(scriptSrcs(html)).toEqual(['/a.js', 'https://x.io/b.js', '//y.io/c.js']);
    expect(thirdPartyScripts(html, HOST)).toEqual(['https://x.io/b.js', '//y.io/c.js']);
  });
  it('passes and fails whole pages', () => {
    expect(checkScriptHosts([page('a.html', '<script src="/_vercel/insights/script.js"></script>')], HOST)).toEqual([]);
    expect(checkScriptHosts([page('a.html', '<script src="https://evil.io/x.js"></script>')], HOST)).toHaveLength(1);
  });
});

describe('TODO(andrew) markers', () => {
  it('passes clean source', () => {
    expect(checkTodos([{ path: 'src/a.ts', text: 'const a = 1; // TODO: generic note' }])).toEqual([]);
  });
  it('reports every marker with file and line', () => {
    const f = checkTodos([{ path: 'src/a.md', text: 'ok\n<!-- TODO(andrew): set the date. -->\n// TODO(andrew): price' }]);
    expect(f.map((x) => x.detail)).toEqual(['src/a.md:2  TODO(andrew): set the date.', 'src/a.md:3  TODO(andrew): price']);
  });
});

describe('bracketed placeholders', () => {
  it('passes real copy, links, and placeholders hidden in scripts or comments', () => {
    const html = '<p>Scores [1 to 5] and [a lowercase note]</p><script>x="[PRICE]"</script><!-- [EMAIL PROVIDER] -->';
    expect(checkPlaceholders([page('a.html', html)])).toEqual([]);
  });
  it('reports each placeholder once with the pages it appears on', () => {
    const f = checkPlaceholders([
      page('a.html', '<p>[PRICE]/mo and [Scale anchors to be written]</p>'),
      page('b.html', '<p>[PRICE]</p>'),
    ]);
    expect(f.map((x) => x.detail)).toEqual(['[PRICE] on a.html, b.html', '[Scale anchors to be written] on a.html']);
  });
  it("passes bracketed text quoted from a brand's homepage copy, but not the same text elsewhere", () => {
    const copy = pageCopyBrackets([
      { pages: [{ brand: 'Brand A', hero_headline: '[NEW] Winter coats', hero_subhead: null, primary_cta: { text: '[Shop Now]' } }], not_captured: [{ brand: '[Brand Q]' }] },
    ]);
    expect([...copy]).toEqual(['[NEW]', '[Shop Now]', '[Brand Q]']);
    const f = checkPlaceholders([page('a.html', '<p>[NEW] Winter coats</p><p>[PRICE]</p>')], copy);
    expect(f.map((x) => x.detail)).toEqual(['[PRICE] on a.html']);
  });
});

describe('[ANDREW: ...] markers', () => {
  it('passes copy without markers, including other bracketed text', () => {
    expect(checkAndrewMarkers([{ path: 'src/content/a.md', text: 'Scores [1 to 5]. [PRICE]. ANDREW: no bracket.' }], [page('a.html', '<p>[Andrew] [ANDREW]</p>')])).toEqual([]);
  });
  it('reports every marker in source with file and line, and each built page that has one', () => {
    const f = checkAndrewMarkers(
      [{ path: 'src/content/a.md', text: 'ok\n[ANDREW: effective date] and [ANDREW: rescore time]\n[ANDREW: unclosed' }],
      [page('privacy/index.html', '<p>[ANDREW: one]</p><p>[ANDREW: two]</p>'), page('index.html', '<p>clean</p>')],
    );
    expect(f.map((x) => x.detail)).toEqual([
      'src/content/a.md:2  [ANDREW: effective date]',
      'src/content/a.md:2  [ANDREW: rescore time]',
      'src/content/a.md:3  [ANDREW: unclosed',
      'privacy/index.html: 2 markers, first [ANDREW: one]',
    ]);
  });
  it('shortens long markers', () => {
    const f = checkAndrewMarkers([{ path: 'a.md', text: `[ANDREW: ${'x'.repeat(200)}]` }], []);
    expect(f[0]!.detail.length).toBeLessThan(100);
    expect(f[0]!.detail.endsWith('...')).toBe(true);
  });
});

describe('"[ANDREW" anywhere under src/', () => {
  it('passes files without the string', () => {
    expect(checkAndrewAnywhere([{ path: 'src/a.md', text: '[Andrew] ANDREW: no bracket. [PRICE]' }])).toEqual([]);
  });
  it('reports every variant the colon rule misses, in any file', () => {
    const f = checkAndrewAnywhere([
      { path: 'src/a.svg', text: '<text>[ANDREW]</text>\n[ANDREW - date] [ANDREW date]\n[ANDREW: x]' },
    ]);
    expect(f.map((x) => x.detail)).toEqual([
      'src/a.svg:1  [ANDREW]',
      'src/a.svg:2  [ANDREW - date]',
      'src/a.svg:2  [ANDREW date]',
      'src/a.svg:3  [ANDREW: x]',
    ]);
  });
});

describe('fixture brands in src/content/', () => {
  it('passes content without fixture brands', () => {
    expect(checkFixtureBrands([{ path: 'src/content/scoreboard/x.md', text: 'brand: Real Brand Co.\nbrand: Brandless\nbrand: Brand Ambassadors' }])).toEqual([]);
  });
  it('reports each file with its "Brand A" style names and fixture screenshots', () => {
    const f = checkFixtureBrands([{ path: 'src/content/scoreboard/x.md', text: 'brand: "Brand A (placeholder)"\nbrand: Brand T\nscreenshot: /shots/fixtures/placeholder-1.png' }]);
    expect(f.map((x) => x.detail)).toEqual(['src/content/scoreboard/x.md: Brand A, Brand T, /shots/fixtures/']);
  });
});

describe('fixture content in built pages', () => {
  it('passes a production page', () => {
    expect(checkFixtureContent([page('index.html', '<title>Page Teardown</title><p>Brandless wins. Brand Ambassadors.</p><img src="/shots/2026-11-02/x.webp">')])).toEqual([]);
  });
  it('fails a production build with fixture content: names, screenshots or the banner, each listing its pages', () => {
    const f = checkFixtureContent([
      page('index.html', '<p>Brand A (placeholder)</p>'),
      page('page/x/index.html', '<meta property="og:title" content="Brand K (placeholder): homepage scorecard"><img src="/shots/fixtures/placeholder-1.png" alt="">'),
      page('privacy/index.html', '<div class="banner" data-pt-fixture role="note"></div>'),
    ]);
    expect(f.map((x) => x.detail)).toEqual([
      '"Brand A" style placeholder names on 2 pages (index.html, page/x/index.html); build without PT_FIXTURES=1',
      '/shots/fixtures/ screenshots on 1 pages (page/x/index.html); build without PT_FIXTURES=1',
      'the data-pt-fixture banner on 1 pages (privacy/index.html); build without PT_FIXTURES=1',
    ]);
  });
  it('ignores the names inside scripts and comments', () => {
    expect(checkFixtureContent([page('a.html', '<script>"Brand A"</script><!-- Brand B -->')])).toEqual([]);
  });
});

describe('draft rubric noindex', () => {
  const noindex = '<meta name="robots" content="noindex, nofollow">';
  const board = (path: string, head = '') => page(path, `<html><head>${head}</head><body data-board-page>`);
  it('passes when every board page is noindex while the rubric is a draft', () => {
    expect(checkDraftNoindex([board('index.html', noindex), board('page/x/index.html', noindex), page('watchlist/index.html', '<body>')], '1.0-draft')).toEqual([]);
  });
  it('fails an indexable board page, marked or under a board path, while the rubric is a draft', () => {
    const f = checkDraftNoindex([board('index.html'), page('brand/brand-a/index.html', '<body>'), page('privacy/index.html', '<body>')], '1.0-draft');
    expect(f).toHaveLength(1);
    expect(f[0]!.detail).toBe('rubric 1.0-draft is a draft but 2 board pages are indexable (index.html, brand/brand-a/index.html)');
  });
  it('does not apply once the rubric is approved', () => {
    expect(checkDraftNoindex([board('index.html')], '1.0')).toEqual([]);
  });
  it('leaves the holding page alone', () => {
    expect(checkDraftNoindex([page('index.html', '<body><h1>Retail homepages, scored</h1>')], '1.0-draft')).toEqual([]);
  });
});

describe('privacy page', () => {
  it('passes when /privacy/ is built', () => {
    expect(checkPrivacyPage([page('privacy/index.html', '')])).toEqual([]);
  });
  it('fails when it is missing', () => {
    expect(checkPrivacyPage([page('index.html', '')])).toHaveLength(1);
  });
});

describe('signup endpoint', () => {
  it('passes when forms were built with an endpoint', () => {
    expect(checkSignupEndpoint([page('a.html', '<form class="signup" action="https://x" data-signup data-live="true">')])).toEqual([]);
  });
  it('fails, once, listing pages whose forms were built without one', () => {
    const f = checkSignupEndpoint([
      page('a.html', '<form class="signup" action="/signups-soon/" data-signup data-live="false">'),
      page('b.html', '<form data-signup data-live="false">'),
      page('c.html', '<p>no form</p>'),
    ]);
    expect(f).toHaveLength(1);
    expect(f[0]!.detail).toContain('2 pages');
  });
});

describe('robots.txt', () => {
  it('passes when crawling is allowed', () => {
    expect(checkRobots('User-agent: *\nAllow: /\n\nSitemap: https://www.pageteardown.com/sitemap-index.xml\n')).toEqual([]);
    expect(checkRobots('User-agent: BadBot\nDisallow: /\n\nUser-agent: *\nDisallow: /private/\n')).toEqual([]);
  });
  it('fails when everything is disallowed for every agent, or the file is missing', () => {
    expect(checkRobots('# pre-launch\nUser-agent: *\nDisallow: /\n')).toHaveLength(1);
    expect(checkRobots(undefined)).toHaveLength(1);
  });
});

describe('og:image', () => {
  const og = (url: string) => `<meta property="og:image" content="${url}">`;
  const files = new Set(['og/default.png']);
  it('passes when indexable pages point at a built image; noindex pages are skipped', () => {
    expect(checkOgImages([page('a.html', og(`${SITE_URL}/og/default.png`)), page('404.html', '<meta name="robots" content="noindex, nofollow">')], files, SITE_URL)).toEqual([]);
  });
  it('fails on a missing tag, a missing file, or an off-site image', () => {
    const f = checkOgImages(
      [page('a.html', '<title>x</title>'), page('b.html', og(`${SITE_URL}/og/nope.png`)), page('c.html', og('https://cdn.example.com/og.png'))],
      files,
      SITE_URL,
    );
    expect(f.map((x) => x.detail)).toEqual(['a.html: no og:image', 'b.html: og:image /og/nope.png is not in dist/', 'c.html: og:image points off-site (cdn.example.com)']);
  });
});

describe('footer contact', () => {
  it('checks for support@pageteardown.com', () => {
    expect(EMAIL).toBe('support@pageteardown.com');
  });
  it('fails a footer that still shows the old address', () => {
    expect(checkFooterContact([page('a.html', '<footer><a href="mailto:hello@pageteardown.com">hello@pageteardown.com</a></footer>')], EMAIL)).toHaveLength(1);
  });
  it('passes when the footer links the contact address', () => {
    expect(checkFooterContact([page('a.html', `<footer><a href="mailto:${EMAIL}">${EMAIL}</a></footer>`)], EMAIL)).toEqual([]);
  });
  it('fails when the footer lacks it or there is no footer', () => {
    const f = checkFooterContact([page('a.html', '<footer>Contact: [CONTACT EMAIL]</footer>'), page('b.html', `<main>${EMAIL}</main>`)], EMAIL);
    expect(f.map((x) => x.detail)).toEqual([`a.html: footer lacks ${EMAIL}`, 'b.html: no <footer>']);
  });
});
