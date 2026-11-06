// Plays through every guided lesson with real typed commands and keystrokes.
// Fails if a lesson gets stuck, the page throws an error, or the phone layout scrolls sideways.
//
//   npm install --no-save playwright
//   npx playwright install chromium
//   node tests/playthrough.cjs
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForTimeout(300);

  const keys = async (...ks) => { for (const k of ks) await page.evaluate(k => window.__xeTrainer.handleKey(k), k); };
  const type = async (s, enter = true) => { await keys('C-u'); for (const ch of s) await keys(ch === ' ' ? 'Space' : ch); if (enter) await keys('Enter'); };
  const inPager = () => page.evaluate(() => !!window.__xeTrainer.S.pager);
  const quit = async () => { if (await inPager()) await keys('q'); };
  const open = i => page.evaluate(i => window.__xeTrainer.openLesson(i), i);
  const atStep = () => page.evaluate(() => {
    const lesson = window.__xeTrainer.LESSONS[window.__xeTrainer.S ? 0 : 0];
    return document.querySelectorAll('.steps li.done').length;
  });
  const waitDone = async (i, label) => {
    await page.waitForFunction(idx => {
      const items = document.querySelectorAll('.steps li');
      return items.length && [...items].every(li => !li.classList.contains('todo') && !li.classList.contains('current')) || document.querySelector('.complete');
    }, i, { timeout: 8000 }).catch(() => {});
    const complete = await page.$('.complete');
    if (!complete) throw new Error(`Lesson ${i} (${label}) never completed`);
  };

  // One entry per guided lesson, in order, matching the steps authored in index.html.
  const runs = [
    async () => { await type('journalctl'); await keys('b'); await keys('Space'); await keys('q'); },
    async () => { await type('journalctl -S today'); await quit(); },
    async () => { await type('journalctl'); await keys('G'); await keys('g'); await keys('q'); await type('journalctl -r'); await quit(); },
    async () => { await type('journalctl -u lighthouse.service'); await quit(); await type('journalctl -u lighthouse.service -u nginx.service'); await quit(); },
    async () => { await type('journalctl -k'); await quit(); await type('journalctl -k -p err'); await quit(); },
    async () => { await type('journalctl -p err'); await quit(); await type('journalctl -p crit'); await quit(); },
    async () => { await type('journalctl --since yesterday'); await quit(); await type('journalctl --since "2026-11-03" --until "2026-11-04"'); await quit(); await type('journalctl --since "-6 hours"'); await quit(); },
    async () => { await type('journalctl --list-boots'); await type('journalctl -b -1'); await quit(); await type('journalctl -b -2 -p err'); await quit(); },
    async () => { await type('journalctl -f'); await page.waitForTimeout(2200); await keys('C-c'); },
    async () => { await type('journalctl -fu nginx.service'); await page.waitForTimeout(1600); await keys('C-c'); await type('journalctl -n 10'); await quit(); },
    async () => { await type('journalctl -u lighthouse.service -o short-iso'); await quit(); await type('journalctl -u lighthouse.service -o json-pretty'); await quit(); await type('journalctl -u lighthouse.service -o cat'); await quit(); },
    async () => { await type('journalctl -g "Failed password"'); await quit(); await type('journalctl -g panic -i'); await quit(); },
    async () => { await type('journalctl -xe'); await quit(); await type('journalctl -xe -u lighthouse.service'); await quit(); },
    async () => { await type('journalctl _COMM=sshd'); await quit(); await type('journalctl _SYSTEMD_UNIT=lighthouse.service PRIORITY=2'); await quit(); },
    async () => { await type('journalctl --disk-usage'); await type('journalctl --vacuum-time=7d'); },
    async () => {
      await type('journalctl -k -g "out of memory" -i'); await quit();
      await type('journalctl -u lighthouse.service -g fail -i -o json'); await quit();
      await type('journalctl -b -1 -g "failed password" -i'); await quit();
    },
    async () => { await type('journalctl -n 5'); await quit(); },
  ];

  for (let i = 0; i < runs.length; i++) {
    await open(i);
    await page.waitForTimeout(80);
    await runs[i]();
    await waitDone(i, i);
    console.log(`lesson ${i} ok`);
  }

  // Phone layout: no sideways scroll.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (overflow) errs.push('phone layout scrolls sideways');

  // Other tabs render without throwing.
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const v of ['drill', 'reference', 'config', 'learn']) {
    await page.click(`.tabs button[data-view="${v}"]`);
    await page.waitForTimeout(80);
  }

  await browser.close();
  if (errs.length) { console.error('FAILED:\n' + errs.join('\n')); process.exit(1); }
  console.log('All lessons played through cleanly.');
})();
