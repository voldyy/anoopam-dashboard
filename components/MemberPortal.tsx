'use client';
import { useState } from 'react';
import MemberEditor, { MemberData } from './MemberEditor';

// MOCK DATA FOR TESTING UI (Delete when backend is ready)
const MOCK_DB: MemberData[] = [
  { id: '1', fields: { field_3: 'Mihir', field_5: 'Patel', field_19: 'Mihir & Rajvi Patel', field_20: '123 Main St', field_21: 'Columbia', field_22: 'MD', field_23: '21044', field_9: '555-0100', field_17: 'test@example.com', field_33: 'Rajvi(W)' } }
];

export default function MemberPortal() {
  // Stages: 'LOGIN' -> 'OTP' -> 'SEARCH' -> 'CONFIRM' -> 'EDITOR'
  const [stage, setStage] = useState('LOGIN');
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  
  // Search State
  const [searchFirst, setSearchFirst] = useState("");
  const [searchLast, setSearchLast] = useState("");
  const [searchZip, setSearchZip] = useState("");
  const [searchResults, setSearchResults] = useState<MemberData[]>([]);
  
  const [activeMember, setActiveMember] = useState<MemberData | null>(null);

  // --- 1. SEND OTP ---
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Call your Azure Function here: await api.post('/send-otp', { email })
    alert(`(Simulation) OTP '123456' sent to ${email}`);
    setStage('OTP');
  };

  // --- 2. VERIFY OTP ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== '123456') { alert("Invalid OTP"); return; }
    
    // Check if email exists in DB (Simulation)
    const existing = MOCK_DB.find(m => m.fields.field_17.toLowerCase() === email.toLowerCase());
    
    if (existing) {
      setActiveMember(existing);
      setStage('EDITOR');
    } else {
      // Email not found -> Go to Search
      setStage('SEARCH');
    }
  };

  // --- 3. SEARCH LOGIC (The complex request) ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Logic: 
    // 1. Zip must match first 5 digits
    // 2. Last name exact match (case insensitive)
    // 3. First name must occur in First Name (field_3) OR Label Name (field_19)
    
    const results = MOCK_DB.filter(m => {
        const zipDB = (m.fields.field_23 || "").substring(0, 5);
        const zipQuery = searchZip.substring(0, 5);
        if (zipDB !== zipQuery) return false;

        const lastDB = (m.fields.field_5 || "").toLowerCase();
        if (lastDB !== searchLast.toLowerCase()) return false;

        const firstDB = (m.fields.field_3 || "").toLowerCase();
        const labelDB = (m.fields.field_19 || "").toLowerCase();
        const queryFirst = searchFirst.toLowerCase();
        
        return firstDB.includes(queryFirst) || labelDB.includes(queryFirst);
    });

    setSearchResults(results);
  };

  // --- 4. CONFIRM MATCH ---
  const handleConfirmMatch = (member: MemberData) => {
    // TODO: Link the email to this record via API
    setActiveMember({
        ...member,
        fields: { ...member.fields, field_17: email } // Update email in local state
    });
    setStage('EDITOR');
  };

  // --- 5. CREATE NEW ---
  const handleCreateNew = () => {
    const newMember: MemberData = {
        id: 'new',
        fields: {
            field_3: searchFirst, field_5: searchLast, field_19: `${searchFirst} ${searchLast}`,
            field_23: searchZip, field_17: email, field_9: '', field_20: '', field_21: '', field_22: '', field_33: ''
        }
    };
    setActiveMember(newMember);
    setStage('EDITOR');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      
      {/* STAGE 1: LOGIN */}
      {stage === 'LOGIN' && (
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
            <h1 className="text-3xl font-bold text-[#F37021] mb-2">Member Login</h1>
            <p className="text-gray-500 mb-6">Enter your email to receive a verification code.</p>
            <form onSubmit={handleSendOtp} className="space-y-4">
                <input required type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border rounded text-lg" />
                <button type="submit" className="w-full py-3 bg-[#8B2323] text-white font-bold rounded hover:bg-[#6d1b1b]">Send Code</button>
            </form>
        </div>
      )}

      {/* STAGE 2: OTP */}
      {stage === 'OTP' && (
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-[#8B2323] mb-4">Enter Code</h1>
            <p className="text-gray-500 mb-6">We sent a code to {email}</p>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
                <input required type="text" placeholder="123456" value={otp} onChange={e => setOtp(e.target.value)} className="w-full p-3 border rounded text-lg text-center tracking-widest" />
                <button type="submit" className="w-full py-3 bg-[#F37021] text-white font-bold rounded hover:bg-[#d95d15]">Verify</button>
            </form>
            <button onClick={() => setStage('LOGIN')} className="text-sm text-gray-400 mt-4 underline">Wrong email?</button>
        </div>
      )}

      {/* STAGE 3: SEARCH (If Email not found) */}
      {stage === 'SEARCH' && (
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full">
            <h1 className="text-2xl font-bold text-[#8B2323] mb-2">Find Your Record</h1>
            <p className="text-gray-500 mb-6 text-sm">We couldn't find an account with that email. Let's find you in the directory.</p>
            
            <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-2">
                    <input required placeholder="First Name" value={searchFirst} onChange={e => setSearchFirst(e.target.value)} className="w-1/2 p-3 border rounded" />
                    <input required placeholder="Last Name" value={searchLast} onChange={e => setSearchLast(e.target.value)} className="w-1/2 p-3 border rounded" />
                </div>
                <input required placeholder="Zip Code (5 digits)" maxLength={5} value={searchZip} onChange={e => setSearchZip(e.target.value)} className="w-full p-3 border rounded" />
                <button type="submit" className="w-full py-3 bg-[#8B2323] text-white font-bold rounded">Search</button>
            </form>

            {searchResults.length > 0 && (
                <div className="mt-6 border-t pt-4">
                    <p className="font-bold text-gray-700 mb-2">We found matches:</p>
                    {searchResults.map(res => (
                        <div key={res.id} className="flex justify-between items-center p-3 bg-orange-50 border border-orange-100 rounded mb-2">
                            <div>
                                <p className="font-bold">{res.fields.field_19}</p>
                                <p className="text-sm text-gray-500">{res.fields.field_21}, {res.fields.field_22} {res.fields.field_23}</p>
                            </div>
                            <button onClick={() => handleConfirmMatch(res)} className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">This is me</button>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="mt-6 text-center border-t pt-4">
                <p className="text-sm text-gray-400 mb-2">Not listed above?</p>
                <button onClick={handleCreateNew} className="text-[#F37021] font-bold hover:underline">Create New Record</button>
            </div>
        </div>
      )}

      {/* STAGE 4: EDITOR */}
      {stage === 'EDITOR' && activeMember && (
         <div className="w-full max-w-4xl">
             <div className="mb-4 flex justify-between items-center">
                 <h1 className="text-2xl font-bold text-gray-700">My Profile</h1>
                 <button onClick={() => window.location.reload()} className="text-red-500 underline">Log Out</button>
             </div>
             <MemberEditor 
                member={activeMember} 
                isAdminMode={false} // Hides admin mailing toggles
                onCancel={() => {}} 
                onSave={async (data) => {
                    alert("In a real app, this would save to the backend: " + JSON.stringify(data));
                }} 
             />
         </div>
      )}
    </div>
  );
}