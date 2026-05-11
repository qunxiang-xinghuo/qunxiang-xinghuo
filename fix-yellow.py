import os

target_files = [
    'src/app/login/page.tsx',
    'src/app/library/page.tsx',
    'src/app/library/[id]/page.tsx',
    'src/app/story-hall/page.tsx',
    'src/app/story-hall/long-term/page.tsx',
    'src/app/story/page.tsx',
    'src/app/story/create/page.tsx',
    'src/app/my-stories/page.tsx',
]

replacements = [
    ('#8a9ab0', '#D4B830'),
    ('text-xh-gold/', 'text-xh-yellow/'),
    ('bg-xh-gold/', 'bg-xh-yellow/'),
    ('border-xh-gold/', 'border-xh-yellow/'),
    ('from-xh-gold/', 'from-xh-yellow/'),
    ('to-xh-gold/', 'to-xh-yellow/'),
    ('shadow-xh-gold/', 'shadow-xh-yellow/'),
    ('caret-xh-gold', 'caret-xh-yellow'),
    ('fill-xh-gold', 'fill-xh-yellow'),
    ('text-xh-gold"', 'text-xh-yellow"'),
    ('text-xh-gold ', 'text-xh-yellow '),
    ('bg-xh-gold"', 'bg-xh-yellow"'),
    ('bg-xh-gold ', 'bg-xh-yellow '),
    ('border-xh-gold"', 'border-xh-yellow"'),
    ('border-xh-gold ', 'border-xh-yellow '),
]

count = 0
for f in target_files:
    if not os.path.exists(f):
        print(f'SKIP: {f} not found')
        continue
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()
    orig = content
    for old, new in replacements:
        content = content.replace(old, new)
    if content != orig:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        count += 1
        print(f'MODIFIED: {f}')

print(f'Total modified: {count}')
