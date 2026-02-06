'use client';
import dynamic from 'next/dynamic';

// This is the magic line. "ssr: false" tells Next.js:
// "Do NOT try to run this on the server. Wait for the browser."
const DashboardInner = dynamic(
  () => import('../components/DashboardInner'),
  { ssr: false }
);

export default function Page() {
  return <DashboardInner />;
}