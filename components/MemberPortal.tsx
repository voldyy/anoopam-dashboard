'use client';
import { useState } from 'react';
import MemberEditor, { MemberData } from './MemberEditor';

// --- CONFIGURATION ---
// These are your specific Backend URLs
const EMAIL_FLOW_URL = "https://default6a3682358b304544aeac16b2bfa9cb.65.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/40bb1695f27d4c3b9ed0a3f01e7ed7c4/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qQAQKPv6MwtriFoAHCiGJlAyxej0pxTQF58J8T0Bki8";

const SEARCH_FLOW_URL = "https://default6a3682358b304544aeac16b2bfa9cb.65.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/b37112212bb144089cb86cbd98f99e96/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=32QsyLTj0Q726_mPLwc4rGJlxxt-qLJ7tMn5FrNi6OA";

export default function MemberPortal() {
  const [stage, setStage] = useState('LOGIN');
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  
  // Search State
  const [searchFirst, setSearchFirst] = useState("");
  const [searchLast, setSearchLast] = useState("");
  const [searchZip, setSearchZip] = useState("");
  const [searchResults, setSearchResults] = useState<MemberData[]>([]);
  
  // Data State
  const [activeMember, setActiveMember] = useState<MemberData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);

  // --- 1. CHECK EMAIL & SEND OTP ---
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        // A. Check if Email Exists
        const response = await fetch(EMAIL_FLOW_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });

        if (!response.ok) throw new Error("Email check failed");
        
        const result = await response.json();

        // Expecting Flow to return: { "found": true, "data": { ...SharePointItem... } }
        if (result.found && result.data) {
            setIsExistingUser(true);
            const raw = result.data;
            
            // Map SharePoint data to our format
            const foundMember: MemberData = {
                id: raw.ID || raw.id,
                fields: {
                    field_3: raw.field_3, field_5: raw.field_5, field_19: raw.field_19,
                    field_20: raw.field_20, field_21: raw.field_21, field_22: raw.field_22, field_23: raw.field_23,
                    field_9: raw.field_9, field_17: raw.field_17, field_33: raw.field_33,
                    field_28: raw.field_28, field_29: raw.field_29, field_30: raw.field_30, field_31: raw.field_31
                }
            };
            setActiveMember(foundMember);
        } else {
            // New user
            setIsExistingUser(false);
            setActiveMember(null);
        }

        // B. Simulate Sending OTP
        // (In production, you would add a "Send Email" action to your Power Automate flow)
        alert(`(Simulation) OTP '123456' sent to ${email}`);
        setStage('OTP');

    } catch (err) {
        console.error(err);
        alert("System error checking email. Please check console.");
    } finally {
        setIsLoading(false);
    }
  };

  // --- 2. VERIFY OTP ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== '123456') { alert("Invalid OTP"); return; }
    
    if (isExistingUser && activeMember) {
        // Email match found -> Go straight to Editor
        setStage('EDITOR');
    } else {
        // No match -> Go to Search/Create
        setStage('SEARCH');
    }
  };

  // --- 3. SEARCH (Name + Zip) ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSearchResults([]);

    try {
        const response = await fetch(SEARCH_FLOW_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: searchFirst,
                lastName: searchLast,
                zip: searchZip
            })
        });

        if (!response.ok) throw new Error("Search failed");
        
        const data = await response.json();
        
        // Handle if Power Automate returns array directly or { value: [] }
        const results = Array.isArray(data) ? data : (data.value || []);
        
        const mappedResults: MemberData[] = results.map((item: any) => ({
            id: item.ID || item.id,
            fields: {
                field_3: item.field_3, field_5: item.field_5, field_19: item.field_19,
                field_20: item.field_20, field_21: item.field_21, field_22: item.field_22, field_23: item.field_23,
                field_9: item.field_9, field_17: item.field_17, field_33: item.field_33,
                field_28: item.field_28, field_29: item.field_29, field_30: item.field_30, field_31: item.field_31
            }
        }));

        setSearchResults(mappedResults);
        
    } catch (err) {
        console.error(err);
        alert("Could not search directory.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleConfirmMatch = (member: MemberData) => {
    // Link the email to this record locally
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
            <form onSubmit={handleCheckEmail} className="space-y-4">
                <input required type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
                <button type="submit" disabled={isLoading} className="w-full py-3 bg-[#8B2323] text-white font-bold rounded hover:bg-[#6d1b1b] disabled:opacity-50">
                    {isLoading ? "Checking..." : "Next"}
                </button>
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
            <p className="text-gray-500 mb-6 text-sm">We couldn't find an account with that email. Let's find you in the directory.</p>
            
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
                <p className="text-sm text-gray-400 mb-2">Not listed above?</p>
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
                    alert("UPDATE REQUEST: In a real app, this data would now be sent to Power Automate to update the list.");
                    console.log("Saving Data:", data);
                    window.location.reload();
                }} 
             />
         </div>
      )}
    </div>
  );
}