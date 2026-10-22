import { redirect } from 'next/navigation'

// The CMS only serves the admin panel and the API.
export default function Home() {
  redirect('/admin')
}
