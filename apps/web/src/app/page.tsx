import { redirect } from 'next/navigation'
import { LandingPage } from '@/components/landing/landing-page'

export default function HomePage() {
  // In production, you might want to check authentication here
  // and redirect authenticated users to the dashboard
  
  return <LandingPage />
}