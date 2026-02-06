'use client';
import { Login, useGraph } from '@microsoft/mgt-react';
import { useState } from 'react';

// 1. Define your List structure
type Member = {
  id: string;
  fields: {
    Title: string; // "Title" is usually the default column for Name
    Email: string;
    Phone: string;
    FamilyRaw: string; // The messy column: "Wife: Jane, Kids: Tom (10), Jerry (5)"
  };
};

export default function Dashboard() {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // 2. Fetch data from Microsoft Lists using Graph
  // Replace {site-id} and {list-id} with your actual IDs from Graph Explorer
  const { data, loading } = useGraph(
    '/sites/{anoopammissioninc.sharepoint.com,760b9c3c-5660-4836-a4ba-c076395aaeab,8d69c014-e7db-4116-a6c3-4517fa4c292e}/lists/{1adbed0e-e84b-4512-ad17-8cbfc7ab2041}/items?expand=fields'
  );
  
  const members = data ? data.value : [];

  return (
    <div className="p-8 font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Church Admin Dashboard</h1>
        <Login />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT COLUMN: List of Members */}
        <div className="bg-white p-4 shadow rounded h-screen overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Members ({members.length})</h2>
          {loading && <p>Loading directory...</p>}
          <ul>
            {members.map((member: Member) => (
              <li 
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="p-3 border-b cursor-pointer hover:bg-blue-50 transition"
              >
                <div className="font-bold">{member.fields.Title}</div>
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
            <div className="text-gray-400">Select a member to view details</div>
          )}
        </div>
      </div>
    </div>
  );
}

// 4. The Component that fixes your "Messy Data"
function MemberDetailView({ member }: { member: Member }) {
  // Simple regex parser for your "Messy" Family string
  // Assumes format like "Wife: Jane, Son: Tom"
  const parseFamily = (rawString: string) => {
    if (!rawString) return [];
    return rawString.split(',').map(s => s.trim());
  };

  const familyMembers = parseFamily(member.fields.FamilyRaw);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{member.fields.Title}</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-white rounded border">
          <label className="text-xs text-gray-500 uppercase">Phone</label>
          <div className="text-lg">{member.fields.Phone}</div>
        </div>
        <div className="p-4 bg-white rounded border">
          <label className="text-xs text-gray-500 uppercase">Email</label>
          <div className="text-lg">{member.fields.Email}</div>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-2">Family Unit (Parsed)</h3>
      <div className="bg-white p-4 rounded border">
        {familyMembers.length > 0 ? (
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
             <button className="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}