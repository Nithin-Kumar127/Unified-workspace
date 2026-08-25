// client/src/App.tsx
import { Routes, Route, Link } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from './context/AuthContext'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Workspace from './pages/Workspace'

function App() {
  const auth = useContext(AuthContext);

  return (
    // 1. Make the whole app a strict full-screen flex container
    <div className="h-screen flex flex-col bg-gray-900 font-sans">
      
      {/* Navbar (Fixed height, won't shrink) */}
      <nav className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center shrink-0">
        <div className="flex gap-4 items-center max-w-7xl mx-auto w-full px-4">
          <Link to="/" className="text-xl font-bold text-white tracking-wide">Unified Workspace</Link>
          
          <div className="ml-auto flex gap-4 items-center text-sm">
            {auth?.user ? (
              <>
                <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">Dashboard</Link>
                <div className="h-4 w-px bg-gray-600"></div> {/* Divider */}
                <span className="text-gray-400">{auth.user.name}</span>
                <button 
                  onClick={auth.logout} 
                  className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 px-3 py-1.5 rounded transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-300 hover:text-white transition-colors">Login</Link>
                <Link to="/register" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 2. Main content area takes exactly the remaining height */}
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<div className="p-8 text-white text-center">Home Page</div>} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/project/:id" element={<Workspace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App