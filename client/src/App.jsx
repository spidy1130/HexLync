import React from 'react'
import { ToastBar, Toaster } from 'react-hot-toast'
import {Navigate, Route, Routes} from 'react-router-dom'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import ProtectedLayout from './components/ProtectedLayout'
import DashBoard from './pages/DashBoard'
import Sessions from './pages/Sessions'
import Pricing from './pages/Pricing'
import MeetingRoom from './pages/MeetingRoom'
const App = () => {
  return (
    <>
      <Toaster/>
      <Routes>
        {/* public routes */}
        <Route path='/login' element={<Login mode="login"/>} />
        <Route path='/register' element={<Login mode="register"/>} />


        {/* private routes */}
        <Route element={<ProtectedRoute/>}>
            <Route element={<ProtectedLayout/>}>

                <Route path='/dashboard' element={<DashBoard/>} />
                <Route path='/sessions' element={<Sessions/>} />
                <Route path='/pricing' element={<Pricing/>} />

            </Route>
              <Route path='/meeting/:meetingId' element={<MeetingRoom/>} />

        </Route>



        {/* other routes */}


        <Route path='*' element={<Navigate to='/dashboard' replace/> } />
      </Routes>
    </>
  )
}

export default App
