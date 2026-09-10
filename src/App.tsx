import { Routes, Route } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Dashboard from '@/pages/Dashboard'
import NewsList from '@/pages/news/NewsList'
import NewsForm from '@/pages/news/NewsForm'
import EventsList from '@/pages/events/EventsList'
import EventsForm from '@/pages/events/EventsForm'
import FacultyList from '@/pages/faculty/FacultyList'
import FacultyForm from '@/pages/faculty/FacultyForm'
import FacilitiesList from '@/pages/facilities/FacilitiesList'
import FacilitiesForm from '@/pages/facilities/FacilitiesForm'
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
        <Route path="faculty" element={<FacultyList />} />
        <Route path="faculty/create" element={<FacultyForm />} />
        <Route path="faculty/edit/:id" element={<FacultyForm />} />
        <Route path="facilities" element={<FacilitiesList />} />
        <Route path="facilities/create" element={<FacilitiesForm />} />
        <Route path="facilities/edit/:id" element={<FacilitiesForm />} />
      </Route>
    </Routes>
  )
}

export default App
