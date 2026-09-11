const fs = require('fs');

let content = fs.readFileSync('src/components/ProfileView.tsx', 'utf8');

// The grid div is `<div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">`
// Let's replace the whole grid and its contents.
const gridStart = '<div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">';
const gridEndStr = '</div>\n        </div>\n\n        {/* Subscription Status Card */}';

const startIndex = content.indexOf(gridStart);
const endIndex = content.indexOf(gridEndStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newGridContent = `
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">First Name</label>
              <input 
                required
                type="text"
                value={profile.firstName || ''}
                onChange={e => setProfile({...profile, firstName: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                placeholder="John"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Middle Name (Optional)</label>
              <input 
                type="text"
                value={profile.middleName || ''}
                onChange={e => setProfile({...profile, middleName: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                placeholder="Quincy"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Surname</label>
              <input 
                required
                type="text"
                value={profile.surname || ''}
                onChange={e => setProfile({...profile, surname: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                placeholder="Doe"
              />
            </div>
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
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Date of Birth</label>
              <input 
                required
                type="date"
                value={profile.dob || ''}
                onChange={e => setProfile({...profile, dob: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
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
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Province</label>
              <select 
                required
                value={profile.province || 'Gauteng'}
                onChange={e => setProfile({...profile, province: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="Gauteng">Gauteng</option>
                <option value="Western Cape">Western Cape</option>
                <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                <option value="Eastern Cape">Eastern Cape</option>
                <option value="Free State">Free State</option>
                <option value="Limpopo">Limpopo</option>
                <option value="Mpumalanga">Mpumalanga</option>
                <option value="North West">North West</option>
                <option value="Northern Cape">Northern Cape</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Availability</label>
              <div 
                onClick={() => setProfile({...profile, isOnline: !profile.isOnline})}
                className="flex items-center justify-between w-full bg-gray-50 border-none rounded-xl px-4 py-3 cursor-pointer transition-all hover:bg-gray-100"
              >
                <span className="text-gray-700 font-medium">
                  {profile.isOnline ? 'Online & Ready' : 'Offline / Busy'}
                </span>
                <div className={\`w-10 h-6 rounded-full p-1 flex-shrink-0 transition-colors \${profile.isOnline ? 'bg-teal-500' : 'bg-gray-300'}\`}>
                  <div className={\`w-4 h-4 bg-white rounded-full shadow-sm transition-transform \${profile.isOnline ? 'translate-x-4' : 'translate-x-0'}\`} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-6 pb-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Bio / About Me</label>
              <textarea 
                required
                value={profile.bio || ''}
                onChange={e => setProfile({...profile, bio: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all min-h-[120px] resize-none"
                placeholder="Tell us about your experience, skills, and what kind of gigs you are looking for..."
              />
            </div>
          </div>
`;

  content = content.substring(0, startIndex) + newGridContent.trim() + '\n        </div>\n\n        {/* Subscription Status Card */}\n' + content.substring(endIndex + gridEndStr.length);
  fs.writeFileSync('src/components/ProfileView.tsx', content);
  console.log("Updated ProfileView grid");
} else {
  console.log("Could not find grid bounds");
}
