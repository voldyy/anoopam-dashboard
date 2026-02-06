'use client';
import { useState, useEffect, useRef } from 'react';

// Type definition (Must match your data)
export type MemberData = {
  id: string;
  fields: {
    field_3: string;  // First
    field_5: string;  // Last
    field_19: string; // Label
    field_20: string; // Street
    field_21: string; // City
    field_22: string; // State
    field_23: string; // Zip
    field_9: string;  // Phone
    field_17: string; // Email
    field_33: string; // Family
    field_28?: string; // Mailing 1
    field_29?: string; // Mailing 2
    field_30?: string; // Mailing 3
    field_31?: string; // Mailing 4
  };
};

type Props = {
  member: MemberData;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  isAdminMode?: boolean; // Hides Mailing options if false
};

export default function MemberEditor({ member, onSave, onCancel, isAdminMode = false }: Props) {
  const [formData, setFormData] = useState({
    firstName: member.fields.field_3 || "",
    lastName: member.fields.field_5 || "",
    labelName: member.fields.field_19 || "",
    phone: member.fields.field_9 || "",
    email: member.fields.field_17 || "",
    street: member.fields.field_20 || "",
    city: member.fields.field_21 || "",
    state: member.fields.field_22 || "",
    zip: member.fields.field_23 || "",
    familyNotes: member.fields.field_33 || "",
    // Mailing
    laxmi: member.fields.field_28 || "Do Not Mail",
    annakut: member.fields.field_29 || "Do Not Mail",
    calendar: member.fields.field_30 || "Do Not Mail",
    bmn: member.fields.field_31 || "Do Not Mail",
  });

  const [isSaving, setIsSaving] = useState(false);
  
  // --- GOOGLE MAPS INTEGRATION ---
  const streetInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // 1. Load Script if not present
    if (!(window as any).google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDyzhbcAPNG8f6-OOc0tqEveGL1oMGB17w&libraries=places`;
      script.async = true;
      document.body.appendChild(script);
      script.onload = initAutocomplete;
    } else {
      initAutocomplete();
    }

    function initAutocomplete() {
      if (!streetInputRef.current || !(window as any).google) return;

      const autocomplete = new (window as any).google.maps.places.Autocomplete(streetInputRef.current, {
        types: ['address'],
        componentRestrictions: { country: "us" }, // Restrict to US if desired
        fields: ['address_components', 'formatted_address'] // Only fetch what we need to save billing
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.address_components) return;

        // Parse Google's Address Format
        let streetNum = "";
        let route = "";
        let city = "";
        let state = "";
        let zipcode = "";

        place.address_components.forEach((component: any) => {
          const types = component.types;
          if (types.includes("street_number")) streetNum = component.long_name;
          if (types.includes("route")) route = component.long_name;
          if (types.includes("locality")) city = component.long_name;
          if (types.includes("administrative_area_level_1")) state = component.short_name;
          if (types.includes("postal_code")) zipcode = component.long_name;
        });

        // Auto-Fill Form
        setFormData(prev => ({
          ...prev,
          street: `${streetNum} ${route}`.trim(),
          city: city,
          state: state,
          zip: zipcode
        }));
      });
    }
  }, []);

  // --- HANDLERS ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    // Map back to SharePoint IDs
    const payload = {
        field_3: formData.firstName,
        field_5: formData.lastName,
        field_19: formData.labelName,
        field_9: formData.phone,
        field_17: formData.email,
        field_20: formData.street,
        field_21: formData.city,
        field_22: formData.state,
        field_23: formData.zip,
        field_33: formData.familyNotes,
        // Only save mailing flags if admin
        ...(isAdminMode ? {
            field_28: formData.laxmi,
            field_29: formData.annakut,
            field_30: formData.calendar,
            field_31: formData.bmn
        } : {})
    };
    await onSave(payload);
    setIsSaving(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl animate-fade-in-up">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-[#8B2323]">Edit Record</h2>
        <div className="flex gap-2">
            <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
            <button onClick={handleSaveClick} disabled={isSaving} className="px-6 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 shadow">
                {isSaving ? "Saving..." : "Save Changes"}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name Section */}
        <div className="space-y-4">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">First Name</label>
                <input name="firstName" value={formData.firstName} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Last Name</label>
                <input name="lastName" value={formData.lastName} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Display Name</label>
                <input name="labelName" value={formData.labelName} onChange={handleChange} className="w-full border p-2 rounded font-bold text-[#8B2323]" />
            </div>
        </div>

        {/* Contact Section */}
        <div className="space-y-4">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                <input name="phone" value={formData.phone} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                <input name="email" value={formData.email} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
        </div>

        {/* Address Section (With Google Maps Ref) */}
        <div className="md:col-span-2 p-4 bg-orange-50 rounded border border-orange-100">
            <h3 className="text-sm font-bold text-[#F37021] uppercase mb-3">Address (Auto-Fill Enabled)</h3>
            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12">
                    <label className="text-xs text-gray-500">Street</label>
                    <input 
                        ref={streetInputRef} 
                        name="street" 
                        value={formData.street} 
                        onChange={handleChange} 
                        placeholder="Start typing address..."
                        className="w-full border p-2 rounded focus:ring-2 ring-orange-200 outline-none" 
                    />
                </div>
                <div className="col-span-5">
                    <label className="text-xs text-gray-500">City</label>
                    <input name="city" value={formData.city} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div className="col-span-3">
                    <label className="text-xs text-gray-500">State</label>
                    <input name="state" value={formData.state} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div className="col-span-4">
                    <label className="text-xs text-gray-500">Zip</label>
                    <input name="zip" value={formData.zip} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
            </div>
        </div>

        {/* Family Raw Data */}
        <div className="md:col-span-2">
             <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Family Data (Name(Rel), Name(Rel))</label>
             <textarea name="familyNotes" value={formData.familyNotes} onChange={handleChange} className="w-full p-2 border rounded font-mono text-sm h-24" />
        </div>
      </div>
    </div>
  );
}