const fs = require('fs');

let content = fs.readFileSync('src/components/ProfileView.tsx', 'utf8');
content = content.replace(/max-w-2xl/g, 'max-w-4xl');
fs.writeFileSync('src/components/ProfileView.tsx', content);

console.log("Updated widths to max-w-4xl");
