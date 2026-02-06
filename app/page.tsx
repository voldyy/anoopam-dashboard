'use client';
import { Login } from '@microsoft/mgt-react';
import { Providers, ProviderState } from '@microsoft/mgt-element';
import { useState, useEffect } from 'react';

// 1. Define your List structure
type Member = {
  id: string;
  fields: {
    Title: string; // "Title" is usually the default column for Name in SharePoint
    Email: string;
    Phone: string;
    FamilyRaw: string; // Ensure this matches the internal name of your family column
  };
};

export default function Dashboard() {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      const provider = Providers.globalProvider;
      
      // Only fetch if user is signed in
      if (provider && provider.state === ProviderState.SignedIn) {
        setIsSignedIn(true);
        setLoading(true);
        try {
          const client = provider.graph.client;
          
          // IDs inserted directly below
          const siteId = 'anoopammissioninc.sharepoint.com,760b9c3c-5660-4836-a4ba-c076395aaeab,8d69c014-e7db-4116-a6c3-4517fa4c292e';
          const listId = '1adbed0e-e84b-4512-ad17-8cbfc7ab2041';
          
          const response = await client.api(`/sites/${siteId}/lists/${listId}/items?expand=fields`).get();
          
          console.log("Debug: API Response", response); // Check browser console (F12) if data is missing
          setMembers(response.value || []);
        } catch (e) {
          console.error("Failed to fetch list data:", e);
        }
        setLoading(false);
      } else {
        setIsSignedIn(false);
        setMembers([]);
      }
    };

    // Initial fetch
    fetchMembers();

    // Re-fetch if the user logs in/out while on the page
    const updateState = () => fetchMembers();
    Providers.onProviderUpdated(updateState);
    return () => Providers.removeProviderUpdatedListener(updateState);
  }, []);

  return (
    <div className="p-8 font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Church Admin Dashboard</h1>
        <Login />
      </div>

      {!isSignedIn ? (
        <div className="text-center p-10 bg-gray-100 rounded">
          <p>Please sign in to view the directory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT COLUMN: List of Members */}
          <div className="bg-white p-4 shadow rounded h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Members ({members.length})</h2>
            {loading && <p className="text-gray-500">Loading directory...</p>}
            <ul>
              {members.map((member: Member) => (
                <li 
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className={`p-3 border-b cursor-pointer hover:bg-blue-50 transition ${selectedMember?.id === member.id ? 'bg-blue-100' : ''}`}
                >
                  <div className="font-bold">{member.fields.Title || "No Name"}</div>
                  <div className="text-sm text-gray-500">{member.fields.Email}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT COLUMN: Interactive Editor */}
          <div className="col-span-2 bg-gray-50 p-6 rounded shadow">
            {selectedMember ? (
              <MemberDetailView member={selectedMember} />
            ) : (
              <div className="text-gray-400 mt-10 text-center">Select a member to view details</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 4. The Component that fixes your "Messy Data"
function MemberDetailView({ member }: { member: Member }) {
  // Simple regex parser for your "Messy" Family string
  const parseFamily = (rawString: string) => {
    if (!rawString) return [];
    // Split by comma and trim whitespace
    return rawString.split(',').map(s => s.trim());
  };

  // Safe check for FamilyRaw existence
  const familyRaw = member.fields.FamilyRaw || ""; 
  const familyMembers = parseFamily(familyRaw);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{member.fields.Title}</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-white rounded border">
          <label className="text-xs text-gray-500 uppercase font-semibold">Phone</label>
          <div className="text-lg">{member.fields.Phone || "N/A"}</div>
        </div>
        <div className="p-4 bg-white rounded border">
          <label className="text-xs text-gray-500 uppercase font-semibold">Email</label>
          <div className="text-lg">{member.fields.Email || "N/A"}</div>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-2">Family Unit (Parsed)</h3>
      <div className="bg-white p-4 rounded border">
        {familyMembers.length > 0 && familyMembers[0] !== "" ? (
          <div className="flex flex-wrap gap-2">
            {familyMembers.map((fm, idx) => (
              <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {fm}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 italic">No family data found.</p>
        )}
        
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600 mb-2">Add Family Member (Updates List):</p>
          <div className="flex gap-2">
             <input type="text" placeholder="e.g. Daughter: Sarah" className="border p-2 rounded w-full" />
             <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}