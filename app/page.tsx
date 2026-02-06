'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports to prevent SSR issues
const DashboardInner = dynamic(() => import('../components/DashboardInner'), { ssr: false });
const MemberPortal = dynamic(() => import('../components/MemberPortal'), { ssr: false });

export default function Page() {
  const [view, setView] = useState<'HOME' | 'ADMIN' | 'MEMBER'>('HOME');

  if (view === 'HOME') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
         <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center border-t-8 border-[#F37021]">
            <div className="w-20 h-20 bg-[#F37021] rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6 shadow-lg">AM</div>
            <h1 className="text-3xl font-bold text-[#8B2323] mb-8">Anoopam Mission Portal</h1>
            
            <div className="space-y-4">
                <button 
                  onClick={() => setView('MEMBER')}
                  className="w-full py-4 bg-white border-2 border-[#F37021] text-[#F37021] font-bold rounded-xl hover:bg-orange-50 transition text-lg"
                >
                  Member Login
                </button>
                <button 
                  onClick={() => setView('ADMIN')}
                  className="w-full py-4 bg-[#8B2323] text-white font-bold rounded-xl hover:bg-[#6d1b1b] transition text-lg shadow-md"
                >
                  Admin Login
                </button>
            </div>
         </div>
      </div>
    );
  }

  return view === 'ADMIN' ? <DashboardInner /> : <MemberPortal />;
}