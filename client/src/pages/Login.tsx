// client/src/pages/Login.tsx
import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Bring in the login function from our global memory
  const auth = useContext(AuthContext);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });
      
      // Save token and update global state
      auth?.login(response.data.token, response.data.user);
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
        <h2 className="text-3xl font-bold mb-6 text-blue-400 text-center">Welcome Back</h2>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            required
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold transition-colors">
            Login
          </button>
        </form>

        {error && <p className="mt-4 text-center text-red-400">{error}</p>}
      </div>
    </div>
  );
}