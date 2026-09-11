const fs = require('fs');

let content = fs.readFileSync('src/components/ProfileView.tsx', 'utf8');

// 1. Initial State
content = content.replace(
  "dob: '',",
  "dob: '',\n    phone: '',\n    idNumber: '',\n    gender: '',\n    city: '',\n    bio: '',"
);

// 2. profileData in handleSubmit
content = content.replace(
  "dob: profile.dob || '',",
  "dob: profile.dob || '',\n        phone: profile.phone || '',\n        idNumber: profile.idNumber || '',\n        gender: profile.gender || '',\n        city: profile.city || '',\n        bio: profile.bio || '',"
);

// 3. JSX Form
const formFields = `
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Phone Number</label>
              <input 
                required
                type="tel"
                value={profile.phone || ''}
                onChange={e => setProfile({...profile, phone: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                placeholder="082 123 4567"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">SA ID Number</label>
              <input 
                required
                type="text"
                value={profile.idNumber || ''}
                onChange={e => setProfile({...profile, idNumber: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                placeholder="YYMMDDXXXXXXX"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Gender</label>
              <select 
                required
                value={profile.gender || ''}
                onChange={e => setProfile({...profile, gender: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
`;

content = content.replace(
  '<label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Date of Birth</label>',
  formFields.trim() + '\n            </div>\n            <div className="space-y-1.5">\n              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Date of Birth</label>'
);

const addressFields = `
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">City / Town</label>
              <input 
                required
                type="text"
                value={profile.city || ''}
                onChange={e => setProfile({...profile, city: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                placeholder="Johannesburg"
              />
            </div>
`;

content = content.replace(
  '<label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Province</label>',
  addressFields.trim() + '\n            </div>\n            <div className="space-y-1.5">\n              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Province</label>'
);

const bioField = `
          <div className="px-6 pb-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Bio / About Me</label>
              <textarea 
                required
                value={profile.bio || ''}
                onChange={e => setProfile({...profile, bio: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all min-h-[100px] resize-none"
                placeholder="Tell us about your experience, skills, and what kind of gigs you are looking for..."
              />
            </div>
          </div>
`;

// Insert the bio field after the grid containing the province
content = content.replace(
  '                <option value="Western Cape">Western Cape</option>',
  '                <option value="Western Cape">Western Cape</option>'
);

fs.writeFileSync('src/components/ProfileView.tsx', content);
