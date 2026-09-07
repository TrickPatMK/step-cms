import { Routes, Route } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Dashboard from '@/pages/Dashboard'
import NewsList from '@/pages/news/NewsList'
import NewsForm from '@/pages/news/NewsForm'
import EventsList from '@/pages/events/EventsList'
import EventsForm from '@/pages/events/EventsForm'
import Login from '@/pages/Login'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="news" element={<NewsList />} />
        <Route path="news/create" element={<NewsForm />} />
        <Route path="news/edit/:id" element={<NewsForm />} />
        <Route path="events" element={<EventsList />} />
        <Route path="events/create" element={<EventsForm />} />
        <Route path="events/edit/:id" element={<EventsForm />} />
      </Route>
    </Routes>
  )
}

export default App
