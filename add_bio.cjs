const fs = require('fs');

let content = fs.readFileSync('src/components/ProfileView.tsx', 'utf8');

const bioField = `
          </div>
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

content = content.replace(
  '              </select>\n            </div>\n          </div>\n        </div>',
  '              </select>\n            </div>' + bioField + '\n        </div>'
);

fs.writeFileSync('src/components/ProfileView.tsx', content);
