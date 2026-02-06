'use client';
import { Login } from '@microsoft/mgt-react';
import { Providers, ProviderState } from '@microsoft/mgt-element';
import { useState, useEffect } from 'react';

// 1. Define the EXACT structure of your List using the IDs you found
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
    
    // Placeholder for your unorganized family data column.
    // You'll need to find this ID (e.g., field_30) just like you found the others.
    // For now, I've named it 'FamilyNotes' so the code doesn't crash.
    FamilyNotes?: string; 
  };
};

export default function DashboardInner() {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      const provider = Providers.globalProvider;
      
      if (provider && provider.state === ProviderState.SignedIn) {
        setIsSignedIn(true);
        setLoading(true);
        try {
          const client = provider.graph.client;
          
          // YOUR IDs (Already inserted)
          const siteId = 'anoopammissioninc.sharepoint.com,760b9c3c-5660-4836-a4ba-c076395aaeab,8d69c014-e7db-4116-a6c3-4517fa4c292e';
          const listId = '1adbed0e-e84b-4512-ad17-8cbfc7ab2041';
          
          const response = await client.api(`/sites/${siteId}/lists/${listId}/items?expand=fields`).get();
          
          console.log("Debug: API Response", response);
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

    fetchMembers();

    const updateState = () => fetchMembers();
    Providers.onProviderUpdated(updateState);
    return () => Providers.removeProviderUpdatedListener(updateState);
  }, []);

  return (
    <div className="p-8 font-sans max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Church Admin Dashboard</h1>
        <Login />
      </div>

      {!isSignedIn ? (
        <div className="text-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-lg text-gray-600">Please sign in to view the member directory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[80vh]">
          {/* LEFT COLUMN: List of Members */}
          <div className="md:col-span-4 bg-white shadow-lg rounded-lg overflow-hidden flex flex-col h-full border border-gray-200">
            <div className="p-4 bg-gray-50 border-b">
              <h2 className="font-bold text-gray-700">Members ({members.length})</h2>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2">
              {loading && <p className="text-center text-gray-500 py-4">Loading directory...</p>}
              
              <ul className="space-y-1">
                {members.map((member: Member) => (
                  <li 
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className={`p-3 rounded-md cursor-pointer transition duration-150 ease-in-out border border-transparent
                      ${selectedMember?.id === member.id 
                        ? 'bg-blue-50 border-blue-200 shadow-sm' 
                        : 'hover:bg-gray-50 hover:border-gray-200'}`}
                  >
                    {/* Combine First (field_3) and Last (field_5) names */}
                    <div className="font-semibold text-gray-900">
                      {member.fields.field_3 || "Unknown"} {member.fields.field_5 || ""}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {member.fields.field_17 || "No Email"}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT COLUMN: Member Details */}
          <div className="md:col-span-8 bg-white shadow-lg rounded-lg overflow-y-auto h-full border border-gray-200 p-8">
            {selectedMember ? (
              <MemberDetailView member={selectedMember} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Select a member from the left to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MemberDetailView({ member }: { member: Member }) {
  // Simple regex parser for your "Messy" Family string
  // NOTE: Ensure 'FamilyNotes' matches the correct field ID if you find it later
  const parseFamily = (rawString: string | undefined) => {
    if (!rawString) return [];
    return rawString.split(',').map(s => s.trim());
  };

  const familyMembers = parseFamily(member.fields.FamilyNotes);

  return (
    <div>
      <div className="flex items-center space-x-4 mb-8 pb-6 border-b">
        <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {member.fields.field_3 ? member.fields.field_3[0] : "?"}
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            {member.fields.field_3} {member.fields.field_5}
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active Member
          </span>
        </div>
      </div>
      
      {/* Contact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Phone</label>
          <div className="mt-1 text-lg text-gray-900">{member.fields.field_9 || "N/A"}</div>
        </div>
        
        <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email</label>
          <div className="mt-1 text-lg text-gray-900">{member.fields.field_17 || "N/A"}</div>
        </div>

        <div className="p-5 bg-gray-50 rounded-lg border border-gray-200 md:col-span-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Address</label>
          <div className="mt-1 text-lg text-gray-900">
            {member.fields.field_20}<br/>
            {member.fields.field_21}, {member.fields.field_22} {member.fields.field_23}
          </div>
        </div>
      </div>

      {/* Family Section */}
      <h3 className="text-xl font-bold text-gray-900 mb-4">Family Unit</h3>
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        {familyMembers.length > 0 && familyMembers[0] !== "" ? (
          <div className="flex flex-wrap gap-2">
            {familyMembers.map((fm, idx) => (
              <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {fm}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-400 italic mb-2">No family data found in this record.</p>
            <p className="text-xs text-gray-400">
              (Check if the 'Family' column ID is correctly mapped in the code)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}