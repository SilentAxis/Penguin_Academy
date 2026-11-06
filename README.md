# Penguin Academy

Interactive, browser-based trainers for core Linux/systemd tools. Each one runs as a single self-contained HTML file — no install, no server, nothing sent anywhere — and checks your progress as you type real commands against a simulated system.

## -xe Academy

An interactive trainer for [journalctl](https://www.freedesktop.org/software/systemd/man/latest/journalctl.html). You practise with real commands against a simulated systemd journal — a fictional server called `observatory` that crashed once, got broken into once, and has been logging quietly ever since.

### Use it

- **Online:** enable GitHub Pages for this repository (Settings → Pages → Deploy from a branch → `main`, `/ (root)`), then open the address GitHub gives you.
- **Offline:** download `index.html` and open it in a browser.

Click the terminal, type a `journalctl` command, press Enter. Long output opens in a pager, the same way `less` does on a real machine — <kbd>Space</kbd>/<kbd>b</kbd> to page, <kbd>g</kbd>/<kbd>G</kbd> to jump to either end, <kbd>/</kbd> to search, <kbd>q</kbd> to quit.

### What's inside

**A simulated journal.** Four boots of a small web app (`lighthouse.service`) behind `nginx`, backed by `postgresql`, on a box called `observatory`. One boot ends in an out-of-memory kernel panic; one has an overnight SSH brute-force attempt. The trainer understands `journalctl`'s real flags — unit and kernel filtering, priority, time windows, boot selection, following, output formats, grep, field matches, `-xe`, and disk housekeeping — and a strip under the terminal shows what each command actually matched.

**17 lessons in 7 modules**, each with steps the trainer checks as you go: first look, narrowing down (unit, kernel, priority, time, boot), watching live, output & search (including the `-xe` combo everyone eventually reaches for), precision field matches, disk housekeeping, and an expert challenge that strings it all together.

**Drill.** Flashcards for the facts (priority numbers, what each flag does), plus a command drill that makes you type the whole thing from a plain-English task.

**Reference.** Every flag this trainer understands, the priority scale, common journal fields, and pager keys.

**journald.conf builder.** Generates a commented `/etc/systemd/journald.conf` — persistent storage, a size cap, a retention cap, rate limiting — ready to copy to a real machine.

Progress is saved in your browser's local storage.

### How closely it matches journalctl

The trainer follows real `journalctl` behaviour: the pager opens scrolled to the end by default, `-f` disables the pager entirely, `-u` appends `.service` when you leave it off, repeating a filter is OR while different filters AND together, and `-p` selects that severity and everything worse. A few things are simplified on purpose:

- All timestamps are fixed to a specific moment in the story, not your real clock, so lessons stay reproducible wherever and whenever you open the trainer.
- `--utc` is accepted but doesn't change the display, to avoid depending on your browser's timezone.
- There's no real permission model — `sudo journalctl ...` and `journalctl ...` behave identically.

### Development

The page is plain HTML, CSS, and JavaScript in `index.html`: the simulated journal and parser come first, followed by the shell, the pager and follow-mode, the lessons, drill, reference, and config builder.

`tests/playthrough.cjs` plays every lesson with real typed commands in headless Chromium. It fails if a lesson gets stuck, the page logs an error, or the phone layout scrolls sideways. GitHub Actions runs it on every push.

```bash
npm install --no-save playwright
npx playwright install chromium
node tests/playthrough.cjs
```

When you add or change a lesson, update its entry in `runs` in the test so CI keeps checking it.

-xe Academy began life as a sibling to [Ctrl-b Academy](https://github.com/SilentAxis/Ctrl-b-Academy), the same idea applied to `tmux`.

## Licence

GNU General Public License v3.0 — see [LICENSE](LICENSE). The tools these trainers teach are separate projects with their own licences.
