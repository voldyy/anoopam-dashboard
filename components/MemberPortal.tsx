'use client';
import { useState } from 'react';
import MemberEditor, { MemberData } from './MemberEditor';

// YOUR SPECIFIC POWER AUTOMATE URL
const POWER_AUTOMATE_SEARCH_URL = "https://default6a3682358b304544aeac16b2bfa9cb.65.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/40bb1695f27d4c3b9ed0a3f01e7ed7c4/triggers/manual/paths/invoke?api-version=1"; 

export default function MemberPortal() {
  const [stage, setStage] = useState('LOGIN');
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [searchFirst, setSearchFirst] = useState("");
  const [searchLast, setSearchLast] = useState("");
  const [searchZip, setSearchZip] = useState("");
  const [searchResults, setSearchResults] = useState<MemberData[]>([]);
  const [activeMember, setActiveMember] = useState<MemberData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 1. SEND OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    alert(`(Simulation) OTP '123456' sent to ${email}`);
    setStage('OTP');
  };

  // 2. VERIFY OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== '123456') { alert("Invalid OTP"); return; }
    setStage('SEARCH');
  };

  // 3. REAL SEARCH via POWER AUTOMATE
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSearchResults([]); // Clear previous

    try {
        const response = await fetch(POWER_AUTOMATE_SEARCH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: searchFirst,
                lastName: searchLast,
                zip: searchZip
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Power Automate Error:", errText);
            throw new Error("Search failed");
        }
        
        const data = await response.json();
        
        // Ensure data is an array
        const results = Array.isArray(data) ? data : (data.value || []);
        
        // Map the raw SharePoint response to our MemberData structure if needed
        // (Assuming Power Automate returns the raw SharePoint Item structure)
        const mappedResults: MemberData[] = results.map((item: any) => ({
            id: item.ID || item.id, // SharePoint ID
            fields: {
                field_3: item.field_3,
                field_5: item.field_5,
                field_19: item.field_19,
                field_20: item.field_20,
                field_21: item.field_21,
                field_22: item.field_22,
                field_23: item.field_23,
                field_9: item.field_9,
                field_17: item.field_17,
                field_33: item.field_33,
                field_28: item.field_28,
                field_29: item.field_29,
                field_30: item.field_30,
                field_31: item.field_31
            }
        }));

        setSearchResults(mappedResults);
        
    } catch (err) {
        console.error(err);
        alert("Could not connect to directory. Please check console.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleConfirmMatch = (member: MemberData) => {
    setActiveMember({ ...member, fields: { ...member.fields, field_17: email } });
    setStage('EDITOR');
  };

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

  const inputClass = "w-full p-3 border border-gray-300 rounded text-lg text-gray-900 focus:border-[#F37021] outline-none";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* LOGIN */}
      {stage === 'LOGIN' && (
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
            <h1 className="text-3xl font-bold text-[#F37021] mb-2">Member Login</h1>
            <p className="text-gray-500 mb-6">Enter your email to verify your identity.</p>
            <form onSubmit={handleSendOtp} className="space-y-4">
                <input required type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
                <button type="submit" className="w-full py-3 bg-[#8B2323] text-white font-bold rounded hover:bg-[#6d1b1b]">Send Code</button>
            </form>
        </div>
      )}

      {/* OTP */}
      {stage === 'OTP' && (
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-[#8B2323] mb-4">Enter Code</h1>
            <p className="text-gray-500 mb-6">We sent a code to {email}</p>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
                <input required type="text" placeholder="123456" value={otp} onChange={e => setOtp(e.target.value)} className={`${inputClass} text-center tracking-widest`} />
                <button type="submit" className="w-full py-3 bg-[#F37021] text-white font-bold rounded hover:bg-[#d95d15]">Verify</button>
            </form>
        </div>
      )}

      {/* SEARCH */}
      {stage === 'SEARCH' && (
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full">
            <h1 className="text-2xl font-bold text-[#8B2323] mb-2">Find Your Record</h1>
            <p className="text-gray-500 mb-6 text-sm">Let's find you in the directory.</p>
            
            <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-2">
                    <input required placeholder="First Name" value={searchFirst} onChange={e => setSearchFirst(e.target.value)} className={inputClass} />
                    <input required placeholder="Last Name" value={searchLast} onChange={e => setSearchLast(e.target.value)} className={inputClass} />
                </div>
                <input required placeholder="Zip Code (5 digits)" maxLength={5} value={searchZip} onChange={e => setSearchZip(e.target.value)} className={inputClass} />
                <button type="submit" disabled={isLoading} className="w-full py-3 bg-[#8B2323] text-white font-bold rounded disabled:opacity-50">
                    {isLoading ? "Searching..." : "Search"}
                </button>
            </form>

            {searchResults.length > 0 && (
                <div className="mt-6 border-t pt-4">
                    <p className="font-bold text-gray-700 mb-2">We found matches:</p>
                    {searchResults.map(res => (
                        <div key={res.id} className="flex justify-between items-center p-3 bg-orange-50 border border-orange-100 rounded mb-2">
                            <div>
                                <p className="font-bold text-gray-900">{res.fields.field_19}</p>
                                <p className="text-sm text-gray-500">{res.fields.field_21}, {res.fields.field_22} {res.fields.field_23}</p>
                            </div>
                            <button onClick={() => handleConfirmMatch(res)} className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">This is me</button>
                        </div>
                    ))}
                </div>
            )}
             <div className="mt-6 text-center border-t pt-4">
                <button onClick={handleCreateNew} className="text-[#F37021] font-bold hover:underline">Create New Record</button>
            </div>
        </div>
      )}

      {/* EDITOR */}
      {stage === 'EDITOR' && activeMember && (
         <div className="w-full max-w-4xl">
             <MemberEditor 
                member={activeMember} 
                isAdminMode={false}
                onCancel={() => window.location.reload()} 
                onSave={async (data) => {
                    // TODO: Call Power Automate to SAVE (Separate Flow needed for writing data)
                    alert("This is a demo. In the final version, this will save to the database!");
                    window.location.reload();
                }} 
             />
         </div>
      )}
    </div>
  );
}