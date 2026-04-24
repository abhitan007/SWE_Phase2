const fs = require('fs');
const path = require('path');

const replacements = [
  ['text-white', 'text-gray-900'],
  ['text-\\[var\\(--text-secondary\\)\\]', 'text-gray-500'],
  ['bg-\\[var\\(--bg-surface-solid\\)\\]', 'bg-white'],
  ['border-\\[var\\(--border-color\\)\\]', 'border-gray-200'],
  ['premium-gradient-text', 'text-blue-800'],
  ['glass-panel', 'bg-white shadow-sm border border-gray-200'],
  ['text-indigo-400', 'text-indigo-600'],
  ['text-emerald-400', 'text-emerald-600'],
  ['text-rose-400', 'text-rose-600'],
  ['text-amber-400', 'text-amber-600'],
  ['bg-emerald-500/10', 'bg-emerald-50'],
  ['bg-rose-500/10', 'bg-rose-50'],
  ['bg-amber-500/10', 'bg-amber-50'],
  ['bg-indigo-500/10', 'bg-indigo-50'],
  ['bg-transparent', 'bg-transparent'], // Leave bg-transparent alone unless it's in AppShell
  ['bg-\\[#1a1d2d\\]', 'bg-white'] // Fix option backgrounds in selects
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const [find, replace] of replacements) {
        const regex = new RegExp(find, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, replace);
          changed = true;
        }
      }
      
      // Additional specific fixes
      // Table header text colors
      if (content.includes('text-gray-300')) {
        content = content.replace(/text-gray-300/g, 'text-gray-700');
        changed = true;
      }
      if (content.includes('bg-white shadow-sm border border-gray-200 min-h-screen text-gray-700 flex flex-col border-r')) {
        content = content.replace('bg-white shadow-sm border border-gray-200 min-h-screen text-gray-700 flex flex-col border-r', 'w-64 bg-white min-h-screen text-gray-700 flex flex-col border-r border-gray-200');
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated:', fullPath);
      }
    }
  }
}

processDir(path.join(__dirname, 'frontend/src'));
console.log('Refactor complete!');
