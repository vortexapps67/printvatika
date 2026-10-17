"""Repair text that was UTF-8 bytes read back through cp1252.

Symptom: `Rupee 249.00` rendering as `â‚¹249.00` on the cart, `Print Vatika Â·` in
the admin console, `â€”` where an em dash belongs. The files were written through
the wrong codepage, so the bytes of one character became several wrong ones.

The repair is the inverse trip — encode as cp1252, decode as UTF-8 — repeated,
because some strings were mangled more than once. Only runs that genuinely form
valid UTF-8 are rewritten, so real middot, em dash, degree sign and the rupee
sign are untouched: they cannot be encoded as cp1252, or do not decode as UTF-8.

    python scripts/fix-mojibake.py            report only
    python scripts/fix-mojibake.py --write    apply
    python scripts/fix-mojibake.py --write --path src
"""

import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SELF = os.path.abspath(__file__)

# Characters that only turn up in this kind of damage.
DAMAGE = set('ÃÂâƒ¢€‚„…†‡ˆ‰Š‹ŒŽ•–—˜™š›œžŸ¡¦§¨©ª«¬®¯°±²³´µ¶¸¹º»¼½¾¿')
MAX_RUN = 26

EXTS = ('.ts', '.tsx', '.css', '.html', '.js', '.json', '.md')
SKIP_DIRS = {'.git', 'node_modules', '.next'}


def try_decode(seq):
    """Undo one or more cp1252 mis-readings. None when the run is not damaged."""
    out, changed = seq, False
    for _ in range(4):
        try:
            candidate = out.encode('cp1252').decode('utf-8')
        except (UnicodeEncodeError, UnicodeDecodeError):
            break
        if candidate == out:
            break
        out, changed = candidate, True
    return out if changed else None


def scan(text):
    """One pass: return (text, [(before, after), ...])."""
    out, hits, i, n = [], [], 0, len(text)
    while i < n:
        if text[i] in DAMAGE:
            for length in range(min(MAX_RUN, n - i), 1, -1):
                fixed = try_decode(text[i:i + length])
                if fixed is not None:
                    hits.append((text[i:i + length], fixed))
                    out.append(fixed)
                    i += length
                    break
            else:
                out.append(text[i])
                i += 1
            continue
        out.append(text[i])
        i += 1
    return ''.join(out), hits


def fix_text(text):
    """Repair until stable. Twice-mangled strings only clear after a second pass."""
    hits = []
    for _ in range(5):
        text, found = scan(text)
        hits.extend(found)
        if not found:
            break
    return text, hits


def main():
    argv = sys.argv[1:]
    write = '--write' in argv
    only = None
    skip = None
    show = 4
    if '--path' in argv:
        only = argv[argv.index('--path') + 1].replace('\\', '/').strip('/')
    if '--skip' in argv:
        skip = argv[argv.index('--skip') + 1].replace('\\', '/').strip('/')
    if '--show' in argv:
        show = int(argv[argv.index('--show') + 1])

    targets = []
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            if name.endswith(EXTS):
                targets.append(os.path.join(base, name))

    reported = repaired = 0
    for path in sorted(targets):
        if os.path.abspath(path) in (SELF, os.path.join(ROOT, 'scripts', 'make-brand-assets.py')):
            continue
        rel = os.path.relpath(path, ROOT).replace('\\', '/')
        if only and not rel.startswith(only):
            continue
        if skip and rel.startswith(skip):
            continue
        try:
            with open(path, encoding='utf-8') as fh:
                text = fh.read()
        except (UnicodeDecodeError, OSError):
            continue
        if not any(ch in DAMAGE for ch in text):
            continue

        fixed, hits = fix_text(text)
        reported += 1
        if not hits:
            lonely = sorted({ch for ch in text if ch in DAMAGE})
            print('  %-46s unrepairable: %s' % (rel, ' '.join(lonely)))
            continue
        repaired += 1
        print('  %-46s %d repair(s)' % (rel, len(hits)))
        for before, after in hits[:show]:
            print('        %s -> %s' % (ascii(before), ascii(after)))
        if len(hits) > show:
            print('        ... and %d more' % (len(hits) - show))
        if write and fixed != text:
            with open(path, 'w', encoding='utf-8', newline='') as fh:
                fh.write(fixed)

    print('\n%s: %d file(s) with damage, %d repaired' % (
        'applied' if write else 'dry run', reported, repaired))
    if not write:
        print('re-run with --write to apply')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    main()
