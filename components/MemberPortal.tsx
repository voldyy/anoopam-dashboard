'use client';
import { useState, useEffect, useRef } from 'react';

// --- CONFIGURATION ---
const EMAIL_CHECK_URL = "https://default6a3682358b304544aeac16b2bfa9cb.65.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/b37112212bb144089cb86cbd98f99e96/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=32QsyLTj0Q726_mPLwc4rGJlxxt-qLJ7tMn5FrNi6OA";
const SEARCH_FLOW_URL = "https://default6a3682358b304544aeac16b2bfa9cb.65.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/40bb1695f27d4c3b9ed0a3f01e7ed7c4/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qQAQKPv6MwtriFoAHCiGJlAyxej0pxTQF58J8T0Bki8";
const SEND_OTP_URL    = "https://default6a3682358b304544aeac16b2bfa9cb.65.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/ee52a820eba44c49a741ee12a98ed271/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=A-mSK7Jdeu4R-plt0goqaxCc3jPSCeQftJq2VQQw3lo";

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
  <div className="min-h-screen bg-[#F2F2F7] font-sans pb-20 text-gray-900">
    <div className="sticky top-0 z-30 bg-[#F2F2F7]/80 backdrop-blur-md border-b border-gray-300/50 px-5 pt-12 pb-3 flex justify-between items-end transition-all">
      <h1 className="text-[34px] font-bold text-black tracking-tight leading-tight">{title}</h1>
      <div className="mb-1">{action}</div>
    </div>
    <div className="px-5 mt-6 max-w-lg mx-auto animate-fade-in-up">
      {children}
    </div>
  </div>
);

const IOSSection = ({ title, children, footer }: { title?: string, children: React.ReactNode, footer?: string }) => (
  <div className="mb-6">
    {title && <h3 className="ml-4 mb-2 text-[13px] font-medium text-gray-500 uppercase tracking-wide">{title}</h3>}
    <div className="bg-white rounded-[10px] overflow-hidden shadow-sm border border-gray-200 divide-y divide-gray-100">
      {children}
    </div>
    {footer && <p className="ml-4 mt-2 text-[13px] text-gray-400">{footer}</p>}
  </div>
);

const IOSInput = ({ label, value, onChange, placeholder, type = "text", disabled = false, align = "right" }: any) => (
  <div className="flex items-center px-4 py-3 bg-white min-h-[44px]">
    <span className="w-28 text-[17px] text-black font-medium shrink-0">{label}</span>
    <input 
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`flex-1 text-[17px] text-gray-900 placeholder-gray-400 outline-none bg-transparent ${align === "right" ? "text-right" : "text-left"}`}
    />
  </div>
);

const IOSButton = ({ onClick, children, variant = "primary", disabled = false, isLoading = false }: any) => {
  const base = "w-full py-3.5 rounded-[12px] text-[17px] font-semibold transition active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center";
  const styles = variant === "primary" 
    ? "bg-[#007AFF] text-white shadow-sm hover:bg-[#0071eb]" 
    : "bg-white text-[#007AFF] active:bg-gray-50";
    
  return (
    <button onClick={onClick} disabled={disabled || isLoading} className={`${base} ${styles}`}>
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      ) : children}
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

  // --- LOGIC: CHECK EMAIL & SEND OTP ---
  const handleCheckEmail = async () => {
    setIsLoading(true);
    try {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(code);

        // 1. Check if User Exists
        const emailRes = await fetch(EMAIL_CHECK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });

        if (!emailRes.ok) throw new Error("Email check failed");
        const result = await emailRes.json();

        if (result.found && result.data) {
            setIsExistingUser(true);
            setActiveMember(mapSharePointToMember(result.data));
        } else {
            setIsExistingUser(false);
            setActiveMember(null);
        }

        // 2. Send OTP (Real)
        const otpRes = await fetch(SEND_OTP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, otp: code })
        });
        
        if (!otpRes.ok) throw new Error("Failed to send code");
        
        // Success - Move to OTP screen
        setStage('OTP');
    } catch (err) {
        console.error(err);
        alert("Error checking email. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  // --- LOGIC: VERIFY OTP ---
  const handleVerifyOtp = () => {
    if (otpInput !== generatedOtp && otpInput !== "123456") { // 123456 bypass for testing
        alert("Invalid Code"); return; 
    }
    if (isExistingUser && activeMember) setStage('EDITOR');
    else setStage('SEARCH');
  };

  // --- LOGIC: SEARCH ---
  const handleSearch = async () => {
    setIsLoading(true);
    try {
        const response = await fetch(SEARCH_FLOW_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName: searchFirst, lastName: searchLast, zip: searchZip })
        });
        
        if(!response.ok) throw new Error("Search failed");

        const data = await response.json();
        const results = Array.isArray(data) ? data : (data.value || []);
        setSearchResults(results.map(mapSharePointToMember));
    } catch (err) {
        alert("Search failed. Check console.");
    } finally {
        setIsLoading(false);
    }
  };

  // Helper: Map Data
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
        <div className="flex flex-col items-center mb-10 mt-4">
            <div className="w-[84px] h-[84px] bg-[#F37021] rounded-[22px] shadow-lg flex items-center justify-center text-white text-3xl font-bold mb-4">AM</div>
            <p className="text-[17px] text-gray-500 font-medium">Anoopam Mission Portal</p>
        </div>

        <IOSSection footer="We'll send a verification code to this email.">
            <IOSInput label="Email" placeholder="name@example.com" value={email} onChange={(e: any) => setEmail(e.target.value)} type="email" align="left" />
        </IOSSection>
        
        <IOSButton onClick={handleCheckEmail} disabled={!email} isLoading={isLoading}>
            Continue
        </IOSButton>
      </IOSPage>
    );
  }

  if (stage === 'OTP') {
    return (
      <IOSPage title="Verify Identity" action={<button onClick={() => setStage('LOGIN')} className="text-[#007AFF] text-[17px]">Back</button>}>
        <div className="mb-6 px-2 text-center">
             <p className="text-[17px] text-gray-500">Enter the code sent to</p>
             <p className="text-[17px] text-gray-900 font-medium">{email}</p>
        </div>

        <IOSSection>
            <IOSInput label="Code" placeholder="000000" type="tel" value={otpInput} onChange={(e: any) => setOtpInput(e.target.value)} align="center" />
        </IOSSection>

        <IOSButton onClick={handleVerifyOtp} disabled={otpInput.length < 6}>
            Verify
        </IOSButton>
        
        <button className="mt-6 w-full text-[#007AFF] text-[17px] font-medium" onClick={() => handleCheckEmail()}>Resend Code</button>
      </IOSPage>
    );
  }

  if (stage === 'SEARCH') {
    return (
      <IOSPage title="Find Account" action={<button onClick={() => setStage('LOGIN')} className="text-[#007AFF] text-[17px]">Cancel</button>}>
        <p className="text-gray-500 mb-6 px-1 text-[15px]">We couldn't find an account with that email. Let's look you up in the directory.</p>
        
        <IOSSection title="Search Criteria">
            <IOSInput label="First Name" placeholder="Required" value={searchFirst} onChange={(e: any) => setSearchFirst(e.target.value)} />
            <IOSInput label="Last Name" placeholder="Required" value={searchLast} onChange={(e: any) => setSearchLast(e.target.value)} />
            <IOSInput label="Zip Code" placeholder="Required" type="tel" value={searchZip} onChange={(e: any) => setSearchZip(e.target.value)} />
        </IOSSection>
        
        <IOSButton onClick={handleSearch} isLoading={isLoading} disabled={!searchFirst || !searchLast || !searchZip}>
            Search Directory
        </IOSButton>

        {searchResults.length > 0 && (
            <div className="mt-8 animate-fade-in-up">
                <h3 className="ml-4 mb-2 text-[13px] font-medium text-gray-500 uppercase">Search Results</h3>
                <div className="bg-white rounded-[10px] overflow-hidden border border-gray-200 divide-y divide-gray-100">
                    {searchResults.map(res => (
                        <div key={res.id} onClick={() => {
                            setActiveMember({...res, fields: {...res.fields, field_17: email}});
                            setStage('EDITOR');
                        }} className="pl-4 pr-3 py-3 flex justify-between items-center active:bg-gray-50 cursor-pointer transition-colors">
                            <div>
                                <div className="font-semibold text-[17px] text-black">{res.fields.field_19}</div>
                                <div className="text-[15px] text-gray-500">{res.fields.field_21}, {res.fields.field_22}</div>
                            </div>
                            <div className="text-[#007AFF] bg-blue-50 px-3 py-1 rounded-full text-[15px] font-medium">Select</div>
                        </div>
                    ))}
                </div>
            </div>
        )}
        
        {searchResults.length === 0 && !isLoading && (
            <div className="mt-8">
                <IOSButton variant="secondary" onClick={() => {
                    setActiveMember({
                        id: 'new',
                        fields: { field_3: searchFirst, field_5: searchLast, field_19: `${searchFirst} ${searchLast}`, field_23: searchZip, field_17: email, field_9: '', field_20: '', field_21: '', field_22: '', field_33: '' }
                    });
                    setStage('EDITOR');
                }}>Create New Profile</IOSButton>
            </div>
        )}
      </IOSPage>
    );
  }

  if (stage === 'EDITOR' && activeMember) {
    return (
        <IOSEditor 
            member={activeMember} 
            onSave={async (data) => {
                alert("This will eventually trigger a Power Automate flow to save updates.");
                // Add Save Flow Fetch Here
            }} 
            onCancel={() => window.location.reload()}
        />
    );
  }

  return null;
}

// --- IOS STYLE EDITOR COMPONENT ---

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

  // Google Maps Logic
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
    <div className="bg-[#F2F2F7] min-h-screen pb-20 font-sans text-gray-900">
      {/* IOS Navbar */}
      <div className="bg-[#F2F2F7]/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-300 flex justify-between items-center px-4 h-[88px] pt-8 transition-all">
        <button onClick={onCancel} className="text-[#007AFF] text-[17px] active:opacity-50">Cancel</button>
        <span className="font-semibold text-[17px] text-black">Edit Profile</span>
        <button onClick={() => onSave(formData)} className="text-[#007AFF] font-bold text-[17px] active:opacity-50">Done</button>
      </div>

      <div className="px-4 mt-6 max-w-lg mx-auto animate-fade-in-up">
        <IOSSection title="Personal Info">
            <IOSInput label="First Name" value={formData.firstName} onChange={(e: any) => handleChange('firstName', e.target.value)} />
            <IOSInput label="Last Name" value={formData.lastName} onChange={(e: any) => handleChange('lastName', e.target.value)} />
            <IOSInput label="Display" value={formData.labelName} onChange={(e: any) => handleChange('labelName', e.target.value)} />
            <IOSInput label="Phone" type="tel" value={formData.phone} onChange={(e: any) => handleChange('phone', e.target.value)} />
        </IOSSection>

        <IOSSection title="Address">
            <div className="flex items-center px-4 py-3 bg-white min-h-[44px]">
                <span className="w-24 text-[17px] font-medium text-black">Street</span>
                <input ref={streetRef} value={formData.street} onChange={(e) => handleChange('street', e.target.value)} placeholder="Search address..." className="flex-1 text-[17px] text-right outline-none bg-transparent placeholder-gray-400 text-gray-900" />
            </div>
            <IOSInput label="City" value={formData.city} onChange={(e: any) => handleChange('city', e.target.value)} />
            <IOSInput label="State" value={formData.state} onChange={(e: any) => handleChange('state', e.target.value)} />
            <IOSInput label="Zip" type="tel" value={formData.zip} onChange={(e: any) => handleChange('zip', e.target.value)} />
        </IOSSection>

        <IOSSection title="Family Members" footer="Swipe left to delete a member.">
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
            <div key={idx} className="pl-4 pr-2 py-2 flex justify-between items-center bg-white border-b border-gray-100 last:border-0 min-h-[50px]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F2F2F7] text-gray-600 flex items-center justify-center text-[13px] font-bold">{item.tag}</div>
                    <div>
                        <div className="text-[17px] text-black font-normal">{item.name}</div>
                        <div className="text-[13px] text-gray-500 leading-none">{relMap[item.tag] || item.tag}</div>
                    </div>
                </div>
                <button onClick={() => {
                    const n = [...list]; n.splice(idx, 1); updateList(n);
                }} className="text-red-500 p-2 active:bg-red-50 rounded-full">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
            </div>
        ))}
        
        {/* ADD ROW */}
        <div className="pl-4 pr-3 py-2 bg-white flex gap-3 items-center min-h-[50px]">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
            <input 
                placeholder="Name" 
                value={newName} 
                onChange={e => setNewName(e.target.value)} 
                className="flex-1 text-[17px] outline-none text-gray-900 placeholder-gray-400 bg-transparent"
            />
            <select 
                value={newRel} 
                onChange={e => setNewRel(e.target.value)}
                className="bg-[#F2F2F7] rounded-[8px] px-2 py-1.5 text-[15px] outline-none text-black border-none"
            >
                <option value="W">Wife</option>
                <option value="H">Husband</option>
                <option value="S">Son</option>
                <option value="D">Daughter</option>
                <option value="M">Mother</option>
                <option value="F">Father</option>
            </select>
            <button 
                disabled={!newName}
                onClick={() => {
                    updateList([...list, { name: newName, tag: newRel }]);
                    setNewName("");
                }}
                className="text-[#007AFF] font-medium disabled:opacity-30 text-[17px] px-2"
            >
                Add
            </button>
        </div>
    </div>
  );
}