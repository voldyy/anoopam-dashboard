'use client';
import { useState } from 'react';

type Props = {
  rawFamilyString: string;
  isEditing: boolean;
  onUpdate: (s: string) => void;
};

export default function FamilyEditor({ rawFamilyString, isEditing, onUpdate }: Props) {
  // Parsing Logic
  const parse = (str: string) => {
      if(!str) return [];
      const regex = /([^\s,()][^,()]*?)\s*\(([^)]+)\)/g;
      const matches = [...str.matchAll(regex)];
      if (matches.length === 0 && str.length > 3) {
          return str.split(',').map(s => ({ name: s.trim(), tag: '?' }));
      }
      return matches.map(m => ({ name: m[1].trim(), tag: m[2].toUpperCase().trim() }));
  };

  const familyList = parse(rawFamilyString);
  const [newName, setNewName] = useState("");
  const [newRel, setNewRel] = useState("W");

  // Serialization Logic
  const serialize = (list: {name: string, tag: string}[]) => {
      return list.map(item => `${item.name}(${item.tag})`).join(',');
  };

  const addMember = () => {
      if(!newName) return;
      const newList = [...familyList, { name: newName, tag: newRel }];
      onUpdate(serialize(newList));
      setNewName("");
  };

  const removeMember = (index: number) => {
      const newList = [...familyList];
      newList.splice(index, 1);
      onUpdate(serialize(newList));
  };

  const relMap: Record<string, string> = { 'W': 'Wife', 'H': 'Husband', 'S': 'Son', 'D': 'Daughter', 'M': 'Mother', 'F': 'Father' };

  return (
    <div>
        <h3 className="text-xl font-bold text-[#8B2323] mb-4 flex items-center gap-2">Family Unit</h3>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            
            {/* LIST VIEW */}
            <div className="flex flex-wrap gap-2 mb-4">
                {familyList.length > 0 ? familyList.map((fm, idx) => (
                    <div key={idx} className="inline-flex items-center bg-orange-50 border border-orange-100 rounded-full pl-1 pr-3 py-1">
                        <span className="w-8 h-8 rounded-full bg-[#F37021] text-white flex items-center justify-center text-xs font-bold mr-3">
                            {fm.tag}
                        </span>
                        <div className="flex flex-col leading-tight mr-2">
                            <span className="font-bold text-gray-800 text-sm">{fm.name}</span>
                            <span className="text-[10px] text-gray-500 uppercase">{relMap[fm.tag] || fm.tag}</span>
                        </div>
                        {isEditing && (
                            <button onClick={() => removeMember(idx)} className="text-red-400 hover:text-red-600 ml-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>
                )) : (
                    <p className="text-gray-400 italic text-center w-full">No family data recorded.</p>
                )}
            </div>

            {/* ADD INTERFACE */}
            {isEditing && (
                <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                    <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Add Family Member</p>
                    <div className="flex gap-2">
                        <input 
                            placeholder="Name" 
                            className="flex-1 border border-gray-300 p-2 rounded text-sm text-gray-900" // Added text-gray-900
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addMember()}
                        />
                        <select 
                            className="border border-gray-300 p-2 rounded text-sm bg-gray-50 text-gray-900" // Added text-gray-900
                            value={newRel}
                            onChange={(e) => setNewRel(e.target.value)}
                        >
                            <option value="W">Wife</option>
                            <option value="H">Husband</option>
                            <option value="S">Son</option>
                            <option value="D">Daughter</option>
                            <option value="F">Father</option>
                            <option value="M">Mother</option>
                        </select>
                        <button 
                            onClick={addMember}
                            disabled={!newName}
                            className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700 disabled:opacity-50"
                        >
                            Add
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}