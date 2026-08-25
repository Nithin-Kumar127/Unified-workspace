// client/src/pages/Dashboard.tsx
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import api from '../services/api';

// Define the TypeScript shape of our Project data
interface Project {
  id: number;
  name: string;
  description: string;
  role: string;
  created_at: string;
}

export default function Dashboard() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // Fetch projects when the dashboard loads
  useEffect(() => {
    if (auth?.user) {
      fetchProjects();
    }
  }, [auth?.user]);

  const fetchProjects = async () => {
    try {
      // Notice we use our custom 'api' here, not raw 'axios'
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/projects', { name, description });
      setShowModal(false);
      setName('');
      setDescription('');
      fetchProjects(); // Refresh the list after creating
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create project');
    }
  };

  if (!auth?.user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400">
            Welcome, {auth.user.name}
          </h1>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold transition-colors"
          >
            + New Project
          </button>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <p className="text-gray-400 col-span-full text-center py-10">
              You don't have any projects yet. Create one to get started!
            </p>
          ) : (
            projects.map((project) => (
              <div 
                key={project.id} 
                onClick={() => navigate(`/project/${project.id}`)}
                className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold">{project.name}</h3>
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300 capitalize">
                    {project.role}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {project.description || 'No description provided.'}
                </p>
                <div className="text-xs text-gray-500">
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-blue-400">Create New Project</h2>
            
            <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
              <input 
                type="text" 
                placeholder="Project Name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="p-3 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                required
              />
              <textarea 
                placeholder="Short Description (Optional)" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="p-3 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500 resize-none h-24"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              
              <div className="flex justify-end gap-4 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}