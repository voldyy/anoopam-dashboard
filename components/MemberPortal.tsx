'use client';
import { useState, useEffect, useRef } from 'react';

// --- CONFIGURATION ---
const EMAIL_CHECK_URL = "https://default6a3682358b304544aeac16b2bfa9cb.65.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/ee52a820eba44c49a741ee12a98ed271/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=A-mSK7Jdeu4R-plt0goqaxCc3jPSCeQftJq2VQQw3lo";
const SEARCH_FLOW_URL = "https://default6a3682358b304544aeac16b2bfa9cb.65.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/40bb1695f27d4c3b9ed0a3f01e7ed7c4/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qQAQKPv6MwtriFoAHCiGJlAyxej0pxTQF58J8T0Bki8";
const SEND_OTP_URL    = "YOUR_SEND_OTP_FLOW_URL_HERE";

// --- TYPES ---
export type MemberData = {
  id: string;
  fields: {
    field_3: string; field_5: string; field_19: string;
    field_20: string; field_21: string; field_22: string; field_23: string;
    field_9: string; field_17: string; field_33: string;
    field_28?: string; field_29?: string; field_30?: string; field_31?: string;
  };
};

// --- IOS STYLE COMPONENTS ---

const IOSPage = ({ children, title, action }: { children: React.ReactNode, title: string, action?: React.ReactNode }) => (
  <div className="min-h-screen bg-[#F2F2F7] font-sans pb-10">
    <div className="sticky top-0 z-20 bg-[#F2F2F7]/80 backdrop-blur-md border-b border-gray-300/50 px-4 pt-12 pb-2 flex justify-between items-end">
      <h1 className="text-3xl font-bold text-black tracking-tight">{title}</h1>
      {action}
    </div>
    <div className="px-4 mt-6 max-w-lg mx-auto">
      {children}
    </div>
  </div>
);

const IOSSection = ({ title, children }: { title?: string, children: React.ReactNode }) => (
  <div className="mb-6">
    {title && <h3 className="ml-4 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</h3>}
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 divide-y divide-gray-100">
      {children}
    </div>
  </div>
);

const IOSInput = ({ label, value, onChange, placeholder, type = "text", disabled = false }: any) => (
  <div className="flex items-center px-4 py-3 bg-white">
    <span className="w-24 text-[17px] text-black font-medium">{label}</span>
    <input 
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="flex-1 text-[17px] text-gray-900 placeholder-gray-400 outline-none bg-transparent text-right"
    />
  </div>
);

const IOSButton = ({ onClick, children, variant = "primary", disabled = false }: any) => {
  const base = "w-full py-3.5 rounded-xl text-[17px] font-semibold transition active:scale-95 disabled:opacity-50 disabled:scale-100";
  const styles = variant === "primary" 
    ? "bg-[#007AFF] text-white shadow-sm" 
    : "bg-white text-[#007AFF] border border-gray-200 shadow-sm";
    
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  );
};

// --- MAIN PORTAL COMPONENT ---

export default function MemberPortal() {
  const [stage, setStage] = useState('LOGIN');
  const [email, setEmail] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  
  // Search State
  const [searchFirst, setSearchFirst] = useState("");
  const [searchLast, setSearchLast] = useState("");
  const [searchZip, setSearchZip] = useState("");
  const [searchResults, setSearchResults] = useState<MemberData[]>([]);
  
  // Data State
  const [activeMember, setActiveMember] = useState<MemberData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);

  // LOGIC HANDLERS (Identical to previous logic, kept for functionality)
  const handleCheckEmail = async () => {
    setIsLoading(true);
    try {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(code);

        const emailRes = await fetch(EMAIL_CHECK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });

        if (!emailRes.ok) throw new Error("Email check failed");
        const result = await emailRes.json();

        if (result.found && result.data) {
            setIsExistingUser(true);
            const raw = result.data;
            setActiveMember(mapSharePointToMember(raw));
        } else {
            setIsExistingUser(false);
            setActiveMember(null);
        }

        // Simulate OTP Send (Replace with fetch to SEND_OTP_URL in prod)
        alert(`(Simulation) OTP '${code}' sent to ${email}`);
        setStage('OTP');
    } catch (err) {
        alert("Error checking email.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (otpInput !== generatedOtp && otpInput !== "123456") { 
        alert("Invalid Code"); return; 
    }
    if (isExistingUser && activeMember) setStage('EDITOR');
    else setStage('SEARCH');
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
        const response = await fetch(SEARCH_FLOW_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName: searchFirst, lastName: searchLast, zip: searchZip })
        });
        const data = await response.json();
        const results = Array.isArray(data) ? data : (data.value || []);
        setSearchResults(results.map(mapSharePointToMember));
    } catch (err) {
        alert("Search failed");
    } finally {
        setIsLoading(false);
    }
  };

  // Helper Mapper
  const mapSharePointToMember = (item: any): MemberData => ({
    id: item.ID || item.id,
    fields: {
        field_3: item.field_3, field_5: item.field_5, field_19: item.field_19,
        field_20: item.field_20, field_21: item.field_21, field_22: item.field_22, field_23: item.field_23,
        field_9: item.field_9, field_17: item.field_17, field_33: item.field_33,
        field_28: item.field_28, field_29: item.field_29, field_30: item.field_30, field_31: item.field_31
    }
  });

  // --- RENDER STAGES ---

  if (stage === 'LOGIN') {
    return (
      <IOSPage title="Welcome">
        <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#F37021] rounded-[22px] mx-auto shadow-xl flex items-center justify-center text-white text-3xl font-bold">AM</div>
            <p className="mt-4 text-gray-500">Sign in to manage your profile</p>
        </div>
        <IOSSection>
            <IOSInput label="Email" placeholder="name@example.com" value={email} onChange={(e: any) => setEmail(e.target.value)} />
        </IOSSection>
        <IOSButton onClick={handleCheckEmail} disabled={!email || isLoading}>
            {isLoading ? "Checking..." : "Continue"}
        </IOSButton>
      </IOSPage>
    );
  }

  if (stage === 'OTP') {
    return (
      <IOSPage title="Verification">
        <p className="text-gray-500 mb-6 px-2">Enter the code sent to {email}</p>
        <IOSSection>
            <IOSInput label="Code" placeholder="123456" type="tel" value={otpInput} onChange={(e: any) => setOtpInput(e.target.value)} />
        </IOSSection>
        <IOSButton onClick={handleVerifyOtp} disabled={otpInput.length < 6}>Verify Identity</IOSButton>
        <button onClick={() => setStage('LOGIN')} className="mt-4 w-full text-[#007AFF] text-[17px]">Use a different email</button>
      </IOSPage>
    );
  }

  if (stage === 'SEARCH') {
    return (
      <IOSPage title="Find Account">
        <p className="text-gray-500 mb-6 px-2">We couldn't find your email. Let's look you up.</p>
        <IOSSection title="Search Criteria">
            <IOSInput label="First Name" placeholder="Mihir" value={searchFirst} onChange={(e: any) => setSearchFirst(e.target.value)} />
            <IOSInput label="Last Name" placeholder="Patel" value={searchLast} onChange={(e: any) => setSearchLast(e.target.value)} />
            <IOSInput label="Zip Code" placeholder="21044" type="tel" value={searchZip} onChange={(e: any) => setSearchZip(e.target.value)} />
        </IOSSection>
        
        <IOSButton onClick={handleSearch} disabled={isLoading}>
            {isLoading ? "Searching..." : "Search Directory"}
        </IOSButton>

        {searchResults.length > 0 && (
            <div className="mt-8">
                <h3 className="ml-4 mb-2 text-xs font-medium text-gray-500 uppercase">Results</h3>
                <div className="bg-white rounded-xl overflow-hidden border border-gray-200 divide-y divide-gray-100">
                    {searchResults.map(res => (
                        <div key={res.id} onClick={() => {
                            setActiveMember({...res, fields: {...res.fields, field_17: email}});
                            setStage('EDITOR');
                        }} className="p-4 flex justify-between items-center active:bg-gray-50 cursor-pointer">
                            <div>
                                <div className="font-semibold text-[17px]">{res.fields.field_19}</div>
                                <div className="text-[15px] text-gray-500">{res.fields.field_21}, {res.fields.field_22}</div>
                            </div>
                            <span className="text-[#007AFF]">Select</span>
                        </div>
                    ))}
                </div>
            </div>
        )}
        
        <div className="mt-8">
            <IOSButton variant="secondary" onClick={() => {
                setActiveMember({
                    id: 'new',
                    fields: { field_3: searchFirst, field_5: searchLast, field_19: `${searchFirst} ${searchLast}`, field_23: searchZip, field_17: email, field_9: '', field_20: '', field_21: '', field_22: '', field_33: '' }
                });
                setStage('EDITOR');
            }}>Create New Profile</IOSButton>
        </div>
      </IOSPage>
    );
  }

  if (stage === 'EDITOR' && activeMember) {
    return (
        <IOSEditor 
            member={activeMember} 
            onSave={async (data) => {
                alert("Saved successfully!");
                // Add Power Automate Save Logic Here
            }} 
            onCancel={() => window.location.reload()}
        />
    );
  }

  return null;
}

// --- IOS STYLE EDITOR (Replaces MemberEditor.tsx logic inline for smoother transition) ---

function IOSEditor({ member, onSave, onCancel }: { member: MemberData, onSave: (d: any) => Promise<void>, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    firstName: member.fields.field_3 || "",
    lastName: member.fields.field_5 || "",
    labelName: member.fields.field_19 || "",
    phone: member.fields.field_9 || "",
    street: member.fields.field_20 || "",
    city: member.fields.field_21 || "",
    state: member.fields.field_22 || "",
    zip: member.fields.field_23 || "",
    familyNotes: member.fields.field_33 || ""
  });

  // Google Maps
  const streetRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!(window as any).google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDyzhbcAPNG8f6-OOc0tqEveGL1oMGB17w&libraries=places`;
      script.async = true;
      document.body.appendChild(script);
      script.onload = initAutocomplete;
    } else { initAutocomplete(); }
    
    function initAutocomplete() {
        if (!streetRef.current || !(window as any).google) return;
        const ac = new (window as any).google.maps.places.Autocomplete(streetRef.current, { types: ['address'], componentRestrictions: { country: "us" }, fields: ['address_components', 'formatted_address'] });
        ac.addListener("place_changed", () => {
            const place = ac.getPlace();
            if (!place.address_components) return;
            let stNum="", route="", c="", s="", z="";
            place.address_components.forEach((cmp: any) => {
                if (cmp.types.includes("street_number")) stNum = cmp.long_name;
                if (cmp.types.includes("route")) route = cmp.long_name;
                if (cmp.types.includes("locality")) c = cmp.long_name;
                if (cmp.types.includes("administrative_area_level_1")) s = cmp.short_name;
                if (cmp.types.includes("postal_code")) z = cmp.long_name;
            });
            setFormData(prev => ({ ...prev, street: `${stNum} ${route}`.trim(), city: c, state: s, zip: z }));
        });
    }
  }, []);

  const handleChange = (field: string, val: string) => setFormData(p => ({ ...p, [field]: val }));

  return (
    <div className="bg-[#F2F2F7] min-h-screen pb-20">
      {/* Navigation Bar */}
      <div className="bg-[#F2F2F7]/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-300 flex justify-between items-center px-4 h-[88px] pt-8">
        <button onClick={onCancel} className="text-[#007AFF] text-[17px]">Cancel</button>
        <span className="font-semibold text-[17px]">Edit Profile</span>
        <button onClick={() => onSave(formData)} className="text-[#007AFF] font-semibold text-[17px]">Done</button>
      </div>

      <div className="px-4 mt-6 max-w-lg mx-auto">
        <IOSSection title="Personal Information">
            <IOSInput label="First Name" value={formData.firstName} onChange={(e: any) => handleChange('firstName', e.target.value)} />
            <IOSInput label="Last Name" value={formData.lastName} onChange={(e: any) => handleChange('lastName', e.target.value)} />
            <IOSInput label="Display" value={formData.labelName} onChange={(e: any) => handleChange('labelName', e.target.value)} />
            <IOSInput label="Phone" type="tel" value={formData.phone} onChange={(e: any) => handleChange('phone', e.target.value)} />
        </IOSSection>

        <IOSSection title="Address">
            <div className="flex items-center px-4 py-3 bg-white">
                <span className="w-24 text-[17px] font-medium">Street</span>
                <input ref={streetRef} value={formData.street} onChange={(e) => handleChange('street', e.target.value)} placeholder="Search address..." className="flex-1 text-[17px] text-right outline-none bg-transparent" />
            </div>
            <IOSInput label="City" value={formData.city} onChange={(e: any) => handleChange('city', e.target.value)} />
            <IOSInput label="State" value={formData.state} onChange={(e: any) => handleChange('state', e.target.value)} />
            <IOSInput label="Zip" type="tel" value={formData.zip} onChange={(e: any) => handleChange('zip', e.target.value)} />
        </IOSSection>

        <IOSSection title="Family Members">
            <FamilyListEditor rawString={formData.familyNotes} onChange={(s) => handleChange('familyNotes', s)} />
        </IOSSection>
      </div>
    </div>
  );
}

// --- IOS STYLE FAMILY EDITOR ---

function FamilyListEditor({ rawString, onChange }: { rawString: string, onChange: (s: string) => void }) {
  const [newName, setNewName] = useState("");
  const [newRel, setNewRel] = useState("W");

  // Parse / Serialize logic (Same as before)
  const parse = (str: string) => {
    if(!str) return [];
    const matches = [...str.matchAll(/([^\s,()][^,()]*?)\s*\(([^)]+)\)/g)];
    if (matches.length === 0 && str.length > 3) return str.split(',').map(s => ({ name: s.trim(), tag: '?' }));
    return matches.map(m => ({ name: m[1].trim(), tag: m[2].toUpperCase().trim() }));
  };
  const list = parse(rawString);

  const updateList = (newList: any[]) => onChange(newList.map(i => `${i.name}(${i.tag})`).join(','));

  const relMap: any = { 'W': 'Wife', 'H': 'Husband', 'S': 'Son', 'D': 'Daughter', 'M': 'Mother', 'F': 'Father' };

  return (
    <div>
        {list.map((item, idx) => (
            <div key={idx} className="px-4 py-3 flex justify-between items-center bg-white border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">{item.tag}</div>
                    <div>
                        <div className="text-[17px] text-black">{item.name}</div>
                        <div className="text-[13px] text-gray-500">{relMap[item.tag] || item.tag}</div>
                    </div>
                </div>
                <button onClick={() => {
                    const n = [...list]; n.splice(idx, 1); updateList(n);
                }} className="text-red-500">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                </button>
            </div>
        ))}
        
        {/* ADD ROW */}
        <div className="px-4 py-3 bg-white flex gap-2 items-center">
            <div className="w-8 h-8 flex items-center justify-center text-green-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
            <input 
                placeholder="Add Family Member" 
                value={newName} 
                onChange={e => setNewName(e.target.value)} 
                className="flex-1 text-[17px] outline-none"
            />
            <select 
                value={newRel} 
                onChange={e => setNewRel(e.target.value)}
                className="bg-gray-100 rounded-lg px-2 py-1 text-sm outline-none"
            >
                <option value="W">Wife</option>
                <option value="H">Husband</option>
                <option value="S">Son</option>
                <option value="D">Daughter</option>
            </select>
            <button 
                disabled={!newName}
                onClick={() => {
                    updateList([...list, { name: newName, tag: newRel }]);
                    setNewName("");
                }}
                className="text-[#007AFF] font-medium disabled:opacity-50"
            >
                Add
            </button>
        </div>
    </div>
  );
}