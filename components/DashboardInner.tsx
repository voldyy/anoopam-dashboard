'use client';
import { Login } from '@microsoft/mgt-react';
import { Providers, ProviderState } from '@microsoft/mgt-element';
import { useState, useEffect, useMemo } from 'react';

// --- CONFIGURATION ---
// I moved these to the top so they are easier to manage
const CONFIG = {
  siteId: 'anoopammissioninc.sharepoint.com,760b9c3c-5660-4836-a4ba-c076395aaeab,8d69c014-e7db-4116-a6c3-4517fa4c292e',
  listId: '1adbed0e-e84b-4512-ad17-8cbfc7ab2041'
};

// Define structure
type Member = {
  id: string;
  fields: {
    field_3: string;  // firstName
    field_5: string;  // lastName
    field_20: string; // street
    field_21: string; // city
    field_22: string; // state
    field_23: string; // zip
    field_9: string;  // phone
    field_17: string; // email
    FamilyNotes?: string; // Ensure this matches your actual column name/ID if different
  };
};

export default function DashboardInner() {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Function to load (or reload) data
  const fetchAllMembers = async () => {
    const provider = Providers.globalProvider;
    
    if (provider && provider.state === ProviderState.SignedIn) {
      setIsSignedIn(true);
      setLoading(true);
      try {
        const client = provider.graph.client;
        
        let allItems: Member[] = [];
        let nextLink = `/sites/${CONFIG.siteId}/lists/${CONFIG.listId}/items?expand=fields&$top=999`;

        while (nextLink) {
          const response = await client.api(nextLink).get();
          if (response.value) {
            allItems = [...allItems, ...response.value];
          }
          nextLink = response['@odata.nextLink'];
        }
        
        allItems.sort((a, b) => (a.fields.field_3 || "").localeCompare(b.fields.field_3 || ""));
        setMembers(allItems);
        
        // If we currently have a member selected, refresh their data specifically
        if (selectedMember) {
          const updatedSelected = allItems.find(m => m.id === selectedMember.id);
          if (updatedSelected) setSelectedMember(updatedSelected);
        }

      } catch (e) {
        console.error("Failed to fetch list data:", e);
      }
      setLoading(false);
    } else {
      setIsSignedIn(false);
      setMembers([]);
    }
  };

  useEffect(() => {
    fetchAllMembers();
    const updateState = () => fetchAllMembers();
    Providers.onProviderUpdated(updateState);
    return () => Providers.removeProviderUpdatedListener(updateState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter Logic
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    const lowerQuery = searchQuery.toLowerCase();
    
    return members.filter(m => {
      const first = (m.fields.field_3 || "").toLowerCase();
      const last = (m.fields.field_5 || "").toLowerCase();
      const phone = (m.fields.field_9 || "").toLowerCase();
      const email = (m.fields.field_17 || "").toLowerCase();
      
      return first.includes(lowerQuery) || 
             last.includes(lowerQuery) || 
             phone.includes(lowerQuery) ||
             email.includes(lowerQuery);
    });
  }, [members, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FFF8F0] font-sans text-gray-800">
      {/* HEADER */}
      <div className="bg-white border-b-4 border-[#F37021] shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#F37021] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
               AM
             </div>
             <h1 className="text-2xl font-bold text-[#8B2323] tracking-tight">Admin Portal</h1>
          </div>
          <Login />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {!isSignedIn ? (
          <div className="text-center p-20 bg-white rounded-xl shadow-md border border-orange-100 mt-10">
            <h2 className="text-2xl text-[#F37021] font-bold mb-2">Jai Swaminarayan</h2>
            <p className="text-gray-600">Please sign in to access the directory.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[80vh]">
            
            {/* LEFT COLUMN: Search & List */}
            <div className="md:col-span-4 bg-white shadow-lg rounded-xl overflow-hidden flex flex-col h-full border border-gray-100">
              <div className="p-4 bg-[#FFF8F0] border-b border-orange-100">
                <input 
                  type="text" 
                  placeholder="Search members..." 
                  className="w-full p-3 rounded-lg border border-gray-300 focus:border-[#F37021] focus:ring-2 focus:ring-orange-200 outline-none transition"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="mt-2 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">
                  {filteredMembers.length} Matches
                </div>
              </div>
              
              <div className="overflow-y-auto flex-1 p-2 scrollbar-thin scrollbar-thumb-orange-200">
                {loading && filteredMembers.length === 0 && (
                  <p className="text-center text-gray-500 py-10 animate-pulse">Loading directory...</p>
                )}
                <ul className="space-y-1">
                  {filteredMembers.map((member: Member) => (
                    <li 
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className={`p-3 rounded-lg cursor-pointer transition duration-150 ease-in-out border-l-4 
                        ${selectedMember?.id === member.id 
                          ? 'bg-orange-50 border-[#F37021] shadow-sm' 
                          : 'border-transparent hover:bg-gray-50 hover:border-orange-200'}`}
                    >
                      <div className="font-bold text-gray-800">
                        {member.fields.field_3 || "Unknown"} {member.fields.field_5 || ""}
                      </div>
                      <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full inline-block ${member.fields.field_17 ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                        {member.fields.field_17 || "No Email"}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* RIGHT COLUMN: Details */}
            <div className="md:col-span-8 bg-white shadow-lg rounded-xl overflow-y-auto h-full border border-gray-100 p-8 relative">
              {selectedMember ? (
                <MemberDetailView 
                  member={selectedMember} 
                  onRefreshRequest={fetchAllMembers} 
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-300">
                  <div className="text-6xl mb-4 text-orange-100">👤</div>
                  <p className="text-lg">Select a member to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- DETAIL COMPONENT WITH EDIT LOGIC ---

function MemberDetailView({ member, onRefreshRequest }: { member: Member, onRefreshRequest: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newFamilyMember, setNewFamilyMember] = useState("");
  
  // Local state for form fields
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    familyRaw: ""
  });

  // Reset form when member selection changes
  useEffect(() => {
    setFormData({
      firstName: member.fields.field_3 || "",
      lastName: member.fields.field_5 || "",
      phone: member.fields.field_9 || "",
      email: member.fields.field_17 || "",
      street: member.fields.field_20 || "",
      city: member.fields.field_21 || "",
      state: member.fields.field_22 || "",
      zip: member.fields.field_23 || "",
      familyRaw: member.fields.FamilyNotes || ""
    });
    setIsEditing(false); // Exit edit mode when switching users
  }, [member]);

  // Handle generic input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- SAVE FUNCTION ---
  const handleSave = async (overrideData?: any) => {
    setIsSaving(true);
    const provider = Providers.globalProvider;
    if (provider) {
      try {
        const client = provider.graph.client;
        const dataToSave = overrideData || formData;

        // Construct the payload mapping our friendly names to ID names
        const payload = {
            field_3: dataToSave.firstName,
            field_5: dataToSave.lastName,
            field_9: dataToSave.phone,
            field_17: dataToSave.email,
            field_20: dataToSave.street,
            field_21: dataToSave.city,
            field_22: dataToSave.state,
            field_23: dataToSave.zip,
            FamilyNotes: dataToSave.familyRaw // Update this ID if you find the real one
        };

        // PATCH request to update specific fields
        await client.api(`/sites/${CONFIG.siteId}/lists/${CONFIG.listId}/items/${member.id}/fields`)
            .patch(payload);
        
        setIsEditing(false);
        onRefreshRequest(); // Reload the list to show changes
      } catch (e) {
        alert("Error saving data. Check console.");
        console.error(e);
      }
    }
    setIsSaving(false);
  };

  // --- FAMILY LOGIC ---
  const handleAddFamily = async () => {
    if(!newFamilyMember) return;
    
    // Append to existing string
    const currentList = formData.familyRaw ? formData.familyRaw.split(',') : [];
    currentList.push(newFamilyMember.trim());
    const newString = currentList.join(', ');
    
    // Update local state
    const updatedData = { ...formData, familyRaw: newString };
    setFormData(updatedData);
    setNewFamilyMember("");

    // Save immediately
    await handleSave(updatedData);
  };

  const parseFamily = (rawString: string) => {
    if (!rawString) return [];
    return rawString.split(',').map(s => s.trim()).filter(s => s !== "");
  };
  const familyList = parseFamily(formData.familyRaw);

  return (
    <div className="animate-fade-in-up relative">
      
      {/* EDIT TOGGLE BUTTON */}
      <div className="absolute top-0 right-0">
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 text-gray-500 hover:text-[#F37021] transition"
          >
            <span className="text-sm font-semibold">Edit Profile</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded text-sm text-gray-600 hover:bg-gray-100"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-4 py-2 rounded text-sm bg-green-600 text-white font-bold hover:bg-green-700 shadow-md flex items-center gap-2"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* HEADER */}
      <div className="flex items-center space-x-5 mb-8 pb-6 border-b border-gray-100 pr-20">
        <div className="h-20 w-20 bg-gradient-to-br from-[#F37021] to-[#D95D15] rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md flex-shrink-0">
          {formData.firstName ? formData.firstName[0] : "?"}
        </div>
        <div className="w-full">
          {isEditing ? (
            <div className="flex gap-2">
               <input name="firstName" value={formData.firstName} onChange={handleChange} className="border p-2 rounded w-1/2 text-xl font-bold text-[#8B2323]" placeholder="First Name" />
               <input name="lastName" value={formData.lastName} onChange={handleChange} className="border p-2 rounded w-1/2 text-xl font-bold text-[#8B2323]" placeholder="Last Name" />
            </div>
          ) : (
            <h2 className="text-4xl font-bold text-[#8B2323] tracking-tight">
              {formData.firstName} {formData.lastName}
            </h2>
          )}
          <span className="mt-2 inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 uppercase tracking-wide">
            Verified Member
          </span>
        </div>
      </div>
      
      {/* FIELDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Phone */}
        <div className="p-6 bg-[#FFF8F0] rounded-xl border border-orange-100 transition">
          <label className="text-xs font-bold text-[#F37021] uppercase tracking-wide mb-1 block">Phone</label>
          {isEditing ? (
            <input name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border rounded" />
          ) : (
            <div className="text-xl text-gray-800 font-medium">{formData.phone || "N/A"}</div>
          )}
        </div>
        
        {/* Email */}
        <div className="p-6 bg-[#FFF8F0] rounded-xl border border-orange-100 transition">
          <label className="text-xs font-bold text-[#F37021] uppercase tracking-wide mb-1 block">Email</label>
           {isEditing ? (
            <input name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded" />
          ) : (
            <div className="text-xl text-gray-800 font-medium break-all">{formData.email || "N/A"}</div>
          )}
        </div>

        {/* Address */}
        <div className="p-6 bg-[#FFF8F0] rounded-xl border border-orange-100 md:col-span-2 transition">
          <label className="text-xs font-bold text-[#F37021] uppercase tracking-wide mb-1 block">Address</label>
          {isEditing ? (
            <div className="grid grid-cols-2 gap-2">
               <input name="street" value={formData.street} onChange={handleChange} className="col-span-2 p-2 border rounded" placeholder="Street Address" />
               <input name="city" value={formData.city} onChange={handleChange} className="p-2 border rounded" placeholder="City" />
               <div className="flex gap-2">
                 <input name="state" value={formData.state} onChange={handleChange} className="w-1/3 p-2 border rounded" placeholder="State" />
                 <input name="zip" value={formData.zip} onChange={handleChange} className="w-2/3 p-2 border rounded" placeholder="Zip" />
               </div>
            </div>
          ) : (
            <div className="text-xl text-gray-800 font-medium">
              {formData.street}<br/>
              {formData.city ? `${formData.city},` : ""} {formData.state} {formData.zip}
            </div>
          )}
        </div>
      </div>

      {/* FAMILY SECTION */}
      <div>
        <h3 className="text-xl font-bold text-[#8B2323] mb-4 flex items-center gap-2">
           Family Unit
           <span className="h-px bg-gray-200 flex-1 ml-4"></span>
        </h3>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          {familyList.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {familyList.map((fm, idx) => (
                <span key={idx} className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-orange-50 text-[#D95D15] border border-orange-100">
                  {fm}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400 italic">No family data recorded.</p>
            </div>
          )}
          
          {/* Add Family Input (Always visible for quick access) */}
          <div className="mt-6 pt-4 border-t border-dashed border-gray-200 flex gap-2">
            <input 
              type="text" 
              placeholder="Add family member (e.g. Son: Amit)" 
              className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:border-[#F37021] focus:ring-1 focus:ring-[#F37021] outline-none"
              value={newFamilyMember}
              onChange={(e) => setNewFamilyMember(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddFamily()}
            />
            <button 
              onClick={handleAddFamily}
              disabled={isSaving || !newFamilyMember}
              className="bg-[#8B2323] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#6d1b1b] transition disabled:opacity-50"
            >
              {isSaving ? "..." : "Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}