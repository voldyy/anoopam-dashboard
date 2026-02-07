'use client';
import { Login } from '@microsoft/mgt-react';
import { Providers, ProviderState } from '@microsoft/mgt-element';
import { useState, useEffect, useMemo } from 'react';

// --- CONFIGURATION ---
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
    field_19: string; // Name on Address Label
    field_20: string; // street
    field_21: string; // city
    field_22: string; // state
    field_23: string; // zip
    field_9: string;  // phone
    field_17: string; // email
    field_33: string; // Notes (Family Data)
    field_28?: string; field_29?: string; field_30?: string; field_31?: string;
  };
};

export default function DashboardInner() {
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Table Sorting State
  const [sortField, setSortField] = useState<keyof Member['fields'] | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Table Filtering State
  const [tableFilters, setTableFilters] = useState({
    field_3: '', field_5: '', field_19: '', field_20: '', 
    field_21: '', field_22: '', field_23: '', field_9: '', 
    field_17: '', field_33: ''
  });

  // Progress State
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAllMembers = async () => {
    const provider = Providers.globalProvider;
    
    if (provider && provider.state === ProviderState.SignedIn) {
      setIsSignedIn(true);
      setLoading(true);
      setLoadedCount(0);
      setTotalCount(0);

      try {
        const client = provider.graph.client;
        let estimatedTotal = 5000; 
        try {
            const listInfo = await client.api(`/sites/${CONFIG.siteId}/lists/${CONFIG.listId}`).select('list').get();
            if(listInfo.list?.itemCount && listInfo.list.itemCount > 0) {
                estimatedTotal = listInfo.list.itemCount;
            }
        } catch (err) { console.warn("Could not fetch list count", err); }
        setTotalCount(estimatedTotal);

        let allItems: Member[] = [];
        let nextLink = `/sites/${CONFIG.siteId}/lists/${CONFIG.listId}/items?expand=fields&$top=999`;
        let currentProgress = 0;

        while (nextLink) {
          const response = await client.api(nextLink).get();
          if (response.value) {
            allItems = [...allItems, ...response.value];
            currentProgress += response.value.length;
            if(currentProgress > estimatedTotal) {
                estimatedTotal = currentProgress + 1000;
                setTotalCount(estimatedTotal);
            }
            setLoadedCount(currentProgress);
          }
          nextLink = response['@odata.nextLink'];
        }
        
        allItems.sort((a, b) => (a.fields.field_19 || "").localeCompare(b.fields.field_19 || ""));
        setMembers(allItems);

      } catch (e) { console.error("Failed to fetch list data:", e); }
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
  }, []);

  // LIST VIEW FILTER
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    const lowerQuery = searchQuery.toLowerCase();
    const queryParts = lowerQuery.split(' ').filter(q => q.trim() !== "");
    return members.filter(m => {
      const fullSearchText = `${m.fields.field_19 || ""} ${m.fields.field_3 || ""} ${m.fields.field_5 || ""} ${m.fields.field_9 || ""} ${m.fields.field_17 || ""} ${m.fields.field_33 || ""}`.toLowerCase();
      return queryParts.every(part => fullSearchText.includes(part));
    });
  }, [members, searchQuery]);

  // TABLE VIEW FILTER & SORT
  const tableMembers = useMemo(() => {
    // 1. Filter
    let filtered = members.filter(m => {
      return Object.entries(tableFilters).every(([key, value]) => {
        if (!value) return true;
        const cellValue = (m.fields as any)[key];
        if (key === 'field_22') return cellValue === value; // Exact match for State dropdown
        return (cellValue || "").toLowerCase().includes(value.toLowerCase()); // Loose match for others
      });
    });

    // 2. Sort
    if (sortField) {
      filtered.sort((a, b) => {
        const valA = (a.fields[sortField] || "").toLowerCase();
        const valB = (b.fields[sortField] || "").toLowerCase();
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [members, tableFilters, sortField, sortDir]);

  const uniqueStates = useMemo(() => {
    const states = new Set(members.map(m => m.fields.field_22).filter(Boolean));
    return Array.from(states).sort();
  }, [members]);

  const handleTableFilterChange = (field: keyof Member['fields'], value: string) => {
    setTableFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSort = (field: keyof Member['fields']) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] font-sans text-gray-800 flex flex-col">
      {/* HEADER */}
      <div className="bg-white border-b-4 border-[#F37021] shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#F37021] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">AM</div>
             <h1 className="text-2xl font-bold text-[#8B2323] tracking-tight">Admin Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-gray-100 p-1 rounded-lg flex">
              <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${viewMode === 'list' ? 'bg-white shadow text-[#F37021]' : 'text-gray-500 hover:bg-gray-200'}`}>List View</button>
              <button onClick={() => setViewMode('table')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${viewMode === 'table' ? 'bg-white shadow text-[#F37021]' : 'text-gray-500 hover:bg-gray-200'}`}>Table View</button>
            </div>
            <Login />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 flex-grow w-full">
        {!isSignedIn ? (
          <div className="text-center p-20 bg-white rounded-xl shadow-md border border-orange-100 mt-10">
            <h2 className="text-2xl text-[#F37021] font-bold mb-2">Jai Swaminarayan</h2>
            <p className="text-gray-600">Please sign in to access the directory.</p>
          </div>
        ) : loading ? (
          <div className="p-20 text-center">
            <p className="text-[#8B2323] font-bold mb-2 animate-pulse">Fetching Directory...</p>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden shadow-inner max-w-md mx-auto">
              <div className="bg-[#F37021] h-4 rounded-full transition-all duration-300 ease-out" style={{ width: `${totalCount > 0 ? Math.min(100, Math.round((loadedCount / totalCount) * 100)) : 0}%` }}></div>
            </div>
            <p className="text-xs text-gray-500 font-mono">Loaded {loadedCount} of ~{totalCount} entries</p>
          </div>
        ) : viewMode === 'list' ? (
          /* LIST VIEW */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[80vh]">
            <div className="md:col-span-4 bg-white shadow-lg rounded-xl overflow-hidden flex flex-col h-full border border-gray-100 relative">
              <div className="p-4 bg-[#FFF8F0] border-b border-orange-100 space-y-3">
                <button onClick={() => setShowAddModal(true)} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow flex items-center justify-center gap-2 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>New Member</button>
                <input type="text" placeholder="Search (Name, Label, Phone)..." className="w-full p-3 rounded-lg border border-gray-300 focus:border-[#F37021] focus:ring-2 focus:ring-orange-200 outline-none transition" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">{filteredMembers.length} Matches</div>
              </div>
              <div className="overflow-y-auto flex-1 p-2 scrollbar-thin scrollbar-thumb-orange-200">
                <ul className="space-y-1">
                  {filteredMembers.map((member: Member) => (
                    <li key={member.id} onClick={() => setSelectedMember(member)} className={`p-3 rounded-lg cursor-pointer transition duration-150 ease-in-out border-l-4 ${selectedMember?.id === member.id ? 'bg-orange-50 border-[#F37021] shadow-sm' : 'border-transparent hover:bg-gray-50 hover:border-orange-200'}`}>
                      <div className="font-bold text-gray-800 text-base">{member.fields.field_19 || `${member.fields.field_3} ${member.fields.field_5}`}</div>
                      <div className="text-xs text-gray-500 truncate flex items-center gap-1 mt-1"><svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>{member.fields.field_21 || "City N/A"}, {member.fields.field_22 || ""}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:col-span-8 bg-white shadow-lg rounded-xl overflow-y-auto h-full border border-gray-100 p-8 relative">
              {selectedMember ? <MemberDetailView member={selectedMember} onUpdateSuccess={(m) => { setMembers(prev => prev.map(pm => pm.id === m.id ? m : pm)); setSelectedMember(m); }} /> : <div className="flex flex-col items-center justify-center h-full text-gray-300"><div className="text-6xl mb-4 text-orange-100">👤</div><p className="text-lg">Select a member to view details</p></div>}
            </div>
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 h-[80vh] flex flex-col">
            <div className="p-4 bg-[#FFF8F0] border-b border-orange-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#8B2323]">Member Directory Table</h2>
              <div className="text-sm font-semibold text-gray-500">{tableMembers.length} Entries Found</div>
            </div>
            <div className="overflow-auto flex-1">
              <table className="min-w-full divide-y divide-gray-200 text-sm relative">
                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    {[
                      { id: 'field_3', label: 'First Name', sort: true }, { id: 'field_5', label: 'Last Name', sort: true }, { id: 'field_19', label: 'Label Name', sort: true },
                      { id: 'field_20', label: 'Street', sort: false }, { id: 'field_21', label: 'City', sort: false }, { id: 'field_22', label: 'State', sort: false },
                      { id: 'field_23', label: 'Zip', sort: false }, { id: 'field_9', label: 'Phone', sort: false }, { id: 'field_17', label: 'Email', sort: false }, { id: 'field_33', label: 'Family', sort: false }
                    ].map(col => (
                      <th key={col.id} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider align-top">
                        <div className="flex flex-col gap-1">
                          <div className={`flex items-center gap-1 ${col.sort ? 'cursor-pointer hover:text-[#F37021]' : ''}`} onClick={() => col.sort && handleSort(col.id as any)}>
                            {col.label}
                            {col.sort && sortField === col.id && (
                              <svg className={`w-4 h-4 ${sortDir === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            )}
                          </div>
                          {col.id === 'field_22' ? (
                            <select value={tableFilters.field_22} onChange={(e) => handleTableFilterChange('field_22', e.target.value)} className="w-full p-1 text-xs border rounded">
                              <option value="">All</option>
                              {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          ) : (
                            <input 
                              type="text" 
                              placeholder={`Filter ${col.label}...`} 
                              value={(tableFilters as any)[col.id]} 
                              onChange={(e) => handleTableFilterChange(col.id as any, e.target.value)}
                              className="w-full p-1 text-xs border rounded focus:border-[#F37021] outline-none"
                            />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableMembers.map(m => (
                    <tr key={m.id} className="hover:bg-orange-50">
                      <td className="px-3 py-2 whitespace-nowrap font-medium">{m.fields.field_3}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-medium">{m.fields.field_5}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-bold text-[#8B2323]">{m.fields.field_19}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{m.fields.field_20}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{m.fields.field_21}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{m.fields.field_22}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{m.fields.field_23}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{m.fields.field_9}</td>
                      <td className="px-3 py-2 whitespace-nowrap truncate max-w-[150px]">{m.fields.field_17}</td>
                      <td className="px-3 py-2 whitespace-nowrap truncate max-w-[200px] text-xs">{m.fields.field_33}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {showAddModal && <AddMemberModal onClose={() => setShowAddModal(false)} onSuccess={(m) => { setShowAddModal(false); setMembers(prev => [m, ...prev].sort((a, b) => (a.fields.field_19 || "").localeCompare(b.fields.field_19 || ""))); setSelectedMember(m); }} />}
    </div>
  );
}

// --- ADD MEMBER MODAL ---
function AddMemberModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: (m: Member) => void }) {
  const [formData, setFormData] = useState({ firstName: "", lastName: "", labelName: "", phone: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const provider = Providers.globalProvider;
    if (provider) {
      try {
        const client = provider.graph.client;
        const payload = { fields: { field_3: formData.firstName, field_5: formData.lastName, field_19: formData.labelName || `${formData.firstName} ${formData.lastName}`, field_9: formData.phone, field_17: formData.email } };
        const res = await client.api(`/sites/${CONFIG.siteId}/lists/${CONFIG.listId}/items`).post(payload);
        if (res && res.id) {
           const newMemberLocal: Member = { id: res.id, fields: { ...payload.fields, field_20: "", field_21: "", field_22: "", field_23: "", field_33: "" } as any };
           onSuccess(newMemberLocal);
        } else { onClose(); }
      } catch (err) { console.error("Error creating member:", err); alert("Failed to create member."); setIsSubmitting(false); }
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full animate-fade-in-up">
        <h2 className="text-2xl font-bold text-[#8B2323] mb-4">Add New Member</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div><label className="text-xs font-bold text-gray-500 uppercase">First Name *</label><input required className="w-full border p-2 rounded" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /></div>
             <div><label className="text-xs font-bold text-gray-500 uppercase">Last Name</label><input className="w-full border p-2 rounded" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div>
          </div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Display Name</label><input className="w-full border p-2 rounded" placeholder="e.g. Mihir & Rajvi Patel" value={formData.labelName} onChange={e => setFormData({...formData, labelName: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Phone</label><input className="w-full border p-2 rounded" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Email</label><input className="w-full border p-2 rounded" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
          <div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-200 rounded text-gray-700 font-semibold hover:bg-gray-300">Cancel</button><button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-[#F37021] text-white rounded font-bold hover:bg-[#d95d15] disabled:opacity-50">{isSubmitting ? "Creating..." : "Create Member"}</button></div>
        </form>
      </div>
    </div>
  );
}

// --- DETAIL COMPONENT ---
function MemberDetailView({ member, onUpdateSuccess }: { member: Member, onUpdateSuccess: (m: Member) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ labelName: "", firstName: "", lastName: "", phone: "", email: "", street: "", city: "", state: "", zip: "", familyNotes: "", laxmi: "", annakut: "", calendar: "", bmn: "" });
  useEffect(() => {
    setFormData({ labelName: member.fields.field_19 || "", firstName: member.fields.field_3 || "", lastName: member.fields.field_5 || "", phone: member.fields.field_9 || "", email: member.fields.field_17 || "", street: member.fields.field_20 || "", city: member.fields.field_21 || "", state: member.fields.field_22 || "", zip: member.fields.field_23 || "", familyNotes: member.fields.field_33 || "", laxmi: member.fields.field_28 || "Do Not Mail", annakut: member.fields.field_29 || "Do Not Mail", calendar: member.fields.field_30 || "Do Not Mail", bmn: member.fields.field_31 || "Do Not Mail", });
    setIsEditing(false);
  }, [member]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
  const handleSave = async () => {
    setIsSaving(true);
    const provider = Providers.globalProvider;
    if (provider) {
      try {
        const client = provider.graph.client;
        const payload = { field_19: formData.labelName, field_3: formData.firstName, field_5: formData.lastName, field_9: formData.phone, field_17: formData.email, field_20: formData.street, field_21: formData.city, field_22: formData.state, field_23: formData.zip, field_33: formData.familyNotes, field_28: formData.laxmi, field_29: formData.annakut, field_30: formData.calendar, field_31: formData.bmn };
        await client.api(`/sites/${CONFIG.siteId}/lists/${CONFIG.listId}/items/${member.id}/fields`).patch(payload);
        onUpdateSuccess({ ...member, fields: { ...member.fields, ...payload } });
        setIsEditing(false);
      } catch (e) { alert("Error saving data. Check console."); console.error(e); }
    }
    setIsSaving(false);
  };
  const getBadgeColor = (val: string) => { const v = (val || "").toLowerCase(); if(v.includes('do not')) return 'bg-red-100 text-red-800 border-red-200'; if(v.includes('hand') || v.includes('dig')) return 'bg-blue-100 text-blue-800 border-blue-200'; return 'bg-green-100 text-green-800 border-green-200'; };
  return (
    <div className="animate-fade-in-up relative pb-20">
      <div className="absolute top-0 right-0">
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-gray-500 hover:text-[#F37021] transition"><span className="text-sm font-semibold">Edit</span><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
        ) : (
          <div className="flex gap-2"><button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded text-sm text-gray-600 hover:bg-gray-100" disabled={isSaving}>Cancel</button><button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded text-sm bg-green-600 text-white font-bold hover:bg-green-700 shadow-md">{isSaving ? "Saving..." : "Save"}</button></div>
        )}
      </div>
      <div className="flex items-center space-x-5 mb-8 pb-6 border-b border-gray-100 pr-20">
        <div className="h-20 w-20 bg-gradient-to-br from-[#F37021] to-[#D95D15] rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md flex-shrink-0">{formData.labelName ? formData.labelName[0] : (formData.firstName ? formData.firstName[0] : "?")}</div>
        <div className="w-full">
          {isEditing ? (
            <div className="space-y-2"><label className="text-xs font-bold text-gray-400">DISPLAY NAME</label><input name="labelName" value={formData.labelName} onChange={handleChange} className="border p-2 rounded w-full text-xl font-bold text-[#8B2323]" /><div className="flex gap-2 pt-2"><div className="w-1/2"><input name="firstName" value={formData.firstName} onChange={handleChange} className="border p-2 rounded w-full text-sm" placeholder="First Name" /><p className="text-[10px] text-gray-400 uppercase mt-1 font-bold">First Name</p></div><div className="w-1/2"><input name="lastName" value={formData.lastName} onChange={handleChange} className="border p-2 rounded w-full text-sm" placeholder="Last Name" /><p className="text-[10px] text-gray-400 uppercase mt-1 font-bold">Last Name</p></div></div></div>
          ) : (
            <div><h2 className="text-3xl font-bold text-[#8B2323] tracking-tight">{formData.labelName || `${formData.firstName} ${formData.lastName}`}</h2><p className="text-gray-500 text-sm mt-1">{formData.firstName} {formData.lastName}</p></div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-5 bg-[#FFF8F0] rounded-xl border border-orange-100"><label className="text-xs font-bold text-[#F37021] uppercase tracking-wide mb-1 block">Phone</label>{isEditing ? <input name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border rounded" /> : <div className="text-lg font-medium">{formData.phone || "N/A"}</div>}</div>
        <div className="p-5 bg-[#FFF8F0] rounded-xl border border-orange-100"><label className="text-xs font-bold text-[#F37021] uppercase tracking-wide mb-1 block">Email</label>{isEditing ? <input name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded" /> : <div className="text-lg font-medium break-all">{formData.email || "N/A"}</div>}</div>
        <div className="p-5 bg-[#FFF8F0] rounded-xl border border-orange-100 md:col-span-2"><label className="text-xs font-bold text-[#F37021] uppercase tracking-wide mb-1 block">Address</label>{isEditing ? (<div className="grid grid-cols-2 gap-2"><input name="street" value={formData.street} onChange={handleChange} className="col-span-2 p-2 border rounded" /><input name="city" value={formData.city} onChange={handleChange} className="p-2 border rounded" /><div className="flex gap-2"><input name="state" value={formData.state} onChange={handleChange} className="w-1/3 p-2 border rounded" /><input name="zip" value={formData.zip} onChange={handleChange} className="w-2/3 p-2 border rounded" /></div></div>) : (<div className="text-lg font-medium">{formData.street}<br/>{formData.city ? `${formData.city},` : ""} {formData.state} {formData.zip}</div>)}</div>
      </div>
      <div className="mb-8"><h3 className="text-xl font-bold text-[#8B2323] mb-4 flex items-center gap-2">Mailing Preferences<span className="h-px bg-gray-200 flex-1 ml-4"></span></h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="p-4 bg-white border border-gray-200 rounded-lg"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Laxmi Puja Paan</label>{isEditing ? (<select name="laxmi" value={formData.laxmi} onChange={handleChange} className="w-full p-2 border rounded bg-gray-50"><option value="Mail">Mail</option><option value="Do Not Mail">Do Not Mail</option></select>) : (<span className={`px-2 py-1 rounded text-xs font-bold border ${getBadgeColor(formData.laxmi)}`}>{formData.laxmi || "Do Not Mail"}</span>)}</div><div className="p-4 bg-white border border-gray-200 rounded-lg"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Annakut Prasad</label>{isEditing ? (<select name="annakut" value={formData.annakut} onChange={handleChange} className="w-full p-2 border rounded bg-gray-50"><option value="Mail">Mail</option><option value="Do Not Mail">Do Not Mail</option><option value="2025 Hand">2025 Hand</option></select>) : (<span className={`px-2 py-1 rounded text-xs font-bold border ${getBadgeColor(formData.annakut)}`}>{formData.annakut || "Do Not Mail"}</span>)}</div><div className="p-4 bg-white border border-gray-200 rounded-lg"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Annual Calendar</label>{isEditing ? (<select name="calendar" value={formData.calendar} onChange={handleChange} className="w-full p-2 border rounded bg-gray-50"><option value="Mail">Mail</option><option value="Do Not Mail">Do Not Mail</option></select>) : (<span className={`px-2 py-1 rounded text-xs font-bold border ${getBadgeColor(formData.calendar)}`}>{formData.calendar || "Do Not Mail"}</span>)}</div><div className="p-4 bg-white border border-gray-200 rounded-lg"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Brahmanirzar (C)</label>{isEditing ? (<select name="bmn" value={formData.bmn} onChange={handleChange} className="w-full p-2 border rounded bg-gray-50"><option value="BMN">BMN</option><option value="DIG">DIG</option><option value="Do Not Mail">Do Not Mail</option></select>) : (<span className={`px-2 py-1 rounded text-xs font-bold border ${getBadgeColor(formData.bmn)}`}>{formData.bmn || "Do Not Mail"}</span>)}</div></div></div>
      <FamilyEditor rawFamilyString={formData.familyNotes} isEditing={isEditing} onUpdate={(newString) => { setFormData(prev => ({ ...prev, familyNotes: newString })); }} />
    </div>
  );
}

// --- FAMILY EDITOR ---
function FamilyEditor({ rawFamilyString, isEditing, onUpdate }: { rawFamilyString: string, isEditing: boolean, onUpdate: (s: string) => void }) {
  const parse = (str: string) => { if(!str) return []; const regex = /([^\s,()][^,()]*?)\s*\(([^)]+)\)/g; const matches = [...str.matchAll(regex)]; if (matches.length === 0 && str.length > 3) { return str.split(',').map(s => ({ name: s.trim(), tag: '?' })); } return matches.map(m => ({ name: m[1].trim(), tag: m[2].toUpperCase().trim() })); };
  const familyList = parse(rawFamilyString);
  const [newName, setNewName] = useState("");
  const [newRel, setNewRel] = useState("W");
  const serialize = (list: {name: string, tag: string}[]) => { return list.map(item => `${item.name}(${item.tag})`).join(','); };
  const addMember = () => { if(!newName) return; const newList = [...familyList, { name: newName, tag: newRel }]; onUpdate(serialize(newList)); setNewName(""); };
  const removeMember = (index: number) => { const newList = [...familyList]; newList.splice(index, 1); onUpdate(serialize(newList)); };
  const relMap: Record<string, string> = { 'W': 'Wife', 'H': 'Husband', 'S': 'Son', 'D': 'Daughter', 'M': 'Mother', 'F': 'Father' };
  return (
    <div><h3 className="text-xl font-bold text-[#8B2323] mb-4 flex items-center gap-2">Family Unit</h3><div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"><div className="flex flex-wrap gap-2 mb-4">{familyList.length > 0 ? familyList.map((fm, idx) => (<div key={idx} className="inline-flex items-center bg-orange-50 border border-orange-100 rounded-full pl-1 pr-3 py-1"><span className="w-8 h-8 rounded-full bg-[#F37021] text-white flex items-center justify-center text-xs font-bold mr-3">{fm.tag}</span><div className="flex flex-col leading-tight mr-2"><span className="font-bold text-gray-800 text-sm">{fm.name}</span><span className="text-[10px] text-gray-500 uppercase">{relMap[fm.tag] || fm.tag}</span></div>{isEditing && (<button onClick={() => removeMember(idx)} className="text-red-400 hover:text-red-600 ml-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>)}</div>)) : (<p className="text-gray-400 italic text-center w-full">No family data recorded.</p>)}</div>{isEditing && (<div className="mt-4 pt-4 border-t border-dashed border-gray-200"><p className="text-xs font-bold text-gray-400 mb-2 uppercase">Add Family Member</p><div className="flex gap-2"><input placeholder="Name" className="flex-1 border p-2 rounded text-sm" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addMember()} /><select className="border p-2 rounded text-sm bg-gray-50" value={newRel} onChange={(e) => setNewRel(e.target.value)}><option value="W">Wife</option><option value="H">Husband</option><option value="S">Son</option><option value="D">Daughter</option><option value="F">Father</option><option value="M">Mother</option></select><button onClick={addMember} disabled={!newName} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700 disabled:opacity-50">Add</button></div></div>)}</div></div>
  );
}