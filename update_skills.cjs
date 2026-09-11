const fs = require('fs');

let content = fs.readFileSync('src/components/ProfileView.tsx', 'utf8');

// Add skills to initial state
content = content.replace(
  "bio: '',",
  "bio: '',\n    skills: '',"
);

// Add skills to profileData for firestore
content = content.replace(
  "bio: profile.bio || '',",
  "bio: profile.bio || '',\n        skills: profile.skills || '',"
);

// Add Skills input in UI
const skillsField = `
          </div>
          <div className="px-6 pb-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Skills</label>
              <input 
                type="text"
                value={profile.skills || ''}
                onChange={e => setProfile({...profile, skills: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                placeholder="e.g. Plumbing, Electrical, Web Design (comma separated)"
              />
            </div>
`;

content = content.replace(
  '              />\n            </div>\n          </div>\n        </div>',
  '              />\n            </div>' + skillsField + '\n          </div>\n        </div>'
);

// Ensure alert is shown if required
content = content.replace(
  'setSubmitStep(\'success\');\n      \n      await new Promise(r => setTimeout(r, 1500));',
  'setSubmitStep(\'success\');\n      alert("Your profile has been successfully sent for admin review.");\n      \n      await new Promise(r => setTimeout(r, 1500));'
);

fs.writeFileSync('src/components/ProfileView.tsx', content);
