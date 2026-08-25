// client/src/pages/Register.tsx
import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Registering...');

    try {
      // Here is where the frontend talks to the backend pipe we just built!
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        name,
        email,
        password
      });

      console.log('Success:', response.data);
      setStatus('Registration successful! Check console for token.');
      
      // Save token and update global state
      auth?.login(response.data.token, response.data.user);
      
      // Navigate to the dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      setStatus(error.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
        <h2 className="text-3xl font-bold mb-6 text-blue-400 text-center">Create Account</h2>
        
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-3 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            required
          />
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
          <button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold transition-colors"
          >
            Register
          </button>
        </form>

        {status && (
          <p className={`mt-4 text-center ${status.includes('failed') || status.includes('exists') ? 'text-red-400' : 'text-green-400'}`}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}