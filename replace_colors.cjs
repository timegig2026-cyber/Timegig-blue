const fs = require('fs');
const path = require('path');

const colorMap = {
  'teal-50': 'green-50',
  'teal-100': 'green-100',
  'teal-200': 'green-200',
  'teal-300': 'green-300',
  'teal-400': 'green-600',
  'teal-500': 'green-700',
  'teal-600': 'green-800',
  'teal-700': 'green-900',
  'teal-800': 'green-950',
  'teal-900': 'green-950',
  'teal-950': 'green-950',
  'emerald-50': 'green-50',
  'emerald-100': 'green-100',
  'emerald-200': 'green-200',
  'emerald-300': 'green-300',
  'emerald-400': 'green-600',
  'emerald-500': 'green-700',
  'emerald-600': 'green-800',
  'emerald-700': 'green-900',
  'emerald-800': 'green-950',
  'emerald-900': 'green-950',
  'emerald-950': 'green-950'
};

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // We want to replace these strings. We sort by length descending to avoid partial matches
      // Actually word boundaries are better.
      const searchKeys = Object.keys(colorMap).sort((a,b) => b.length - a.length);
      let changed = false;
      
      for (const key of searchKeys) {
        const val = colorMap[key];
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, val);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated:', fullPath);
      }
    }
  }
}

walk('./src');
