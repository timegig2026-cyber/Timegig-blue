const fs = require('fs');
let code = fs.readFileSync('src/components/ProfileView.tsx', 'utf8');

code = code.replace(
  'className="max-w-2xl mx-auto w-full px-6 py-8 flex flex-col gap-8"',
  'className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-8 overflow-hidden"'
);

code = code.replace(
  'className="flex flex-col gap-8 disabled:opacity-75"',
  'className="min-w-0 flex flex-col gap-8 disabled:opacity-75"'
);

code = code.replace(
  /className="flex items-center gap-4"/g,
  'className="flex items-center gap-4 min-w-0"'
);

code = code.replace(
  /className="flex items-center gap-3"/g,
  'className="flex items-center gap-3 min-w-0"'
);

code = code.replace(
  /className="flex flex-col justify-center"/g,
  'className="flex flex-col justify-center flex-1 min-w-0"'
);

code = code.replace(
  /className="text-sm font-bold text-gray-700 truncate group-hover:text-teal-700 transition-colors"/g,
  'className="text-sm font-bold text-gray-700 truncate flex-1 min-w-0 group-hover:text-teal-700 transition-colors"'
);

// Add flex-shrink-0 to the icon wrappers in the file upload section
code = code.replace('className="w-16 h-16 rounded-full', 'className="w-16 h-16 flex-shrink-0 rounded-full');
code = code.replace('className="w-12 h-12 bg-white', 'className="w-12 h-12 flex-shrink-0 bg-white');
code = code.replace('className="w-10 h-10 bg-white', 'className="w-10 h-10 flex-shrink-0 bg-white');
code = code.replace('className="w-8 h-8 bg-white', 'className="w-8 h-8 flex-shrink-0 bg-white');

fs.writeFileSync('src/components/ProfileView.tsx', code);
