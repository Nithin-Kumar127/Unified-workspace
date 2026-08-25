// client/src/pages/Workspace.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../services/api';
import CodeEditor from '../components/CodeEditor';
import { io, Socket } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { useContext, useRef } from 'react';

export default function Workspace() {
    const auth = useContext(AuthContext);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteStatus, setInviteStatus] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const { id } = useParams();
    const navigate = useNavigate();
    
  
  const [project, setProject] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [activeFile, setActiveFile] = useState<any>(null);
  const [code, setCode] = useState('// Select or create a file to start coding');
  
  const [newFileName, setNewFileName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        // Fetch project metadata
        const projRes = await api.get(`/projects/${id}`);
        setProject(projRes.data);
        
        // Fetch file list
        const filesRes = await api.get(`/projects/${id}/files`);
        setFiles(filesRes.data);

        // NEW: Fetch chat history!
        const messagesRes = await api.get(`/projects/${id}/messages`);
        setMessages(messagesRes.data);
        
        // Scroll to the bottom of the chat history
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } catch (error) {
        navigate('/dashboard');
      }
    };
    loadWorkspace();
  }, [id, navigate]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteStatus('Inviting...');
    try {
      await api.post(`/projects/${id}/members`, { email: inviteEmail });
      setInviteStatus('Success! User added.');
      
      // Refresh project data to show the new member in the header
      const projRes = await api.get(`/projects/${id}`);
      setProject(projRes.data);
      
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteStatus('');
      }, 1500);
    } catch (err: any) {
      setInviteStatus(err.response?.data?.error || 'Failed to invite user');
    }
  };

  // WebSocket Connection
  useEffect(() => {
    if (!id || !auth?.user) return;

    // Connect to the Express server
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join the specific project room
    newSocket.emit('join_project', id);

    // Listen for incoming messages
    newSocket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
      // Scroll to bottom
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    // Cleanup when leaving the page
    return () => {
      newSocket.disconnect();
    };
  }, [id, auth?.user]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || !auth?.user) return;

    const messageData = {
      projectId: id,
      userId: auth.user.id,
      userName: auth.user.name,
      content: chatInput
    };

    // Send via WebSocket
    socket.emit('send_message', messageData);
    setChatInput('');
  };

  // Load file content directly from Supabase Storage
  const handleSelectFile = async (file: any) => {
    setActiveFile(file);
    setCode('// Loading file...');
    try {
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/project-files/${file.storage_path}`;
      const response = await axios.get(publicUrl);
      setCode(response.data);
    } catch (error) {
      console.error("Failed to fetch file content", error);
      setCode('// Error loading file content. It might be empty or unavailable.');
    }
  };

  // Save file to our Express Backend
  const handleSave = async () => {
    if (!activeFile && !newFileName) return;
    setIsSaving(true);
    
    const fileName = activeFile ? activeFile.name : newFileName;
    
    try {
      await api.post(`/projects/${id}/files`, {
        name: fileName,
        content: code,
        language: fileName.split('.').pop() === 'py' ? 'python' : 'javascript'
      });
      
      // Refresh file list
      const filesRes = await api.get(`/projects/${id}/files`);
      setFiles(filesRes.data);
      
      // If it was a new file, set it as active and clear the input
      if (!activeFile) {
        const newlyCreated = filesRes.data.find((f: any) => f.name === fileName);
        setActiveFile(newlyCreated);
        setNewFileName('');
      }
    } catch (error) {
      alert('Failed to save file');
    } finally {
      setIsSaving(false);
    }
  };

  if (!project) return <div className="h-full flex items-center justify-center text-gray-400">Loading Workspace...</div>;

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-gray-300">
      
      {/* Header */}
      <header className="bg-[#252526] border-b border-[#333333] h-10 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white text-sm">← Dashboard</button>
          <div className="h-4 w-px bg-gray-600"></div>
          <h1 className="font-semibold text-blue-400 text-sm">{project.name}</h1>
          
          <div className="flex gap-2 flex-shrink-0 ml-4 overflow-hidden items-center">
            {project.members?.map((m: any) => (
              <div key={m.id} className="flex items-center gap-1.5 bg-[#333333] px-2 py-0.5 rounded text-xs border border-[#444]">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="truncate max-w-[80px]" title={m.name}>{m.name}</span>
              </div>
            ))}
            
            {/* NEW: Invite Button */}
            <button 
              onClick={() => setShowInviteModal(true)}
              className="ml-2 text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded transition-colors"
            >
              + Invite
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* SAVE BUTTON */}
          <button 
            onClick={handleSave}
            disabled={isSaving || (!activeFile && !newFileName)}
            className={`text-xs px-3 py-1 rounded font-bold ${isSaving ? 'bg-gray-600 text-gray-400' : 'bg-green-600 hover:bg-green-500 text-white'}`}
          >
            {isSaving ? 'Saving...' : '💾 Save'}
          </button>
        </div>
      </header>

      {/* IDE Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* Left: Explorer */}
        <div className="w-64 bg-[#252526] border-r border-[#333333] flex flex-col shrink-0">
          <div className="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-widest border-b border-[#333333] flex justify-between items-center">
            <span>Explorer</span>
          </div>
          
          {/* Create New File Input */}
          <div className="p-2 border-b border-[#333333] flex gap-2">
            <input 
              type="text" 
              placeholder="newFile.js" 
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#444] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* File List */}
          <div className="flex-1 overflow-y-auto">
            {files.map(file => (
              <div 
                key={file.id} 
                onClick={() => handleSelectFile(file)}
                className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-[#2a2d2e] ${activeFile?.id === file.id ? 'bg-[#37373d] text-white' : 'text-gray-400'}`}
              >
                📄 {file.name}
              </div>
            ))}
          </div>
        </div>

        {/* Middle: Editor */}
        <div className="flex-1 bg-[#1e1e1e] flex flex-col min-w-0">
          <div className="flex bg-[#2d2d2d] h-9 shrink-0 overflow-x-auto">
            {activeFile && (
              <div className="bg-[#1e1e1e] px-4 py-2 text-xs border-t-2 border-blue-500 text-white min-w-[120px] text-center border-r border-[#333]">
                {activeFile.name}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-h-0 border-r border-[#333333]">
            {activeFile || newFileName ? (
               <CodeEditor 
                 code={code} 
                 onChange={(newCode) => setCode(newCode || '')} 
                 language={activeFile?.language || 'javascript'}
               />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 flex-col gap-4">
                <span className="text-4xl">📝</span>
                <p>Select a file from the explorer or create a new one.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Team Chat */}
        <div className="w-72 bg-[#252526] flex flex-col shrink-0 border-l border-[#333333]">
          <div className="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-widest border-b border-[#333333]">
            Team Chat
          </div>
          
          {/* Message History */}
          <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center mt-10">No messages yet. Say hello!</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.userId === auth?.user?.id ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-gray-500 mb-0.5">{msg.userName}</span>
                  <div className={`px-3 py-1.5 rounded-lg max-w-[90%] text-sm ${msg.userId === auth?.user?.id ? 'bg-blue-600 text-white' : 'bg-[#3c3c3c] text-gray-200'}`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-[#333333]">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..." 
              className="w-full bg-[#3c3c3c] border border-transparent rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-500"
            />
          </form>
        </div>

      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#252526] p-6 rounded-lg shadow-xl w-full max-w-sm border border-[#333333]">
            <h2 className="text-xl font-bold mb-4 text-blue-400">Invite Team Member</h2>
            <form onSubmit={handleInvite} className="flex flex-col gap-3">
              <input 
                type="email" 
                placeholder="User's email address" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="p-2 bg-[#1e1e1e] rounded border border-[#444] focus:outline-none focus:border-blue-500 text-sm text-white"
                required
              />
              {inviteStatus && (
                <p className={`text-xs ${inviteStatus.includes('Success') ? 'text-green-400' : 'text-red-400'}`}>
                  {inviteStatus}
                </p>
              )}
              <div className="flex justify-end gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => { setShowInviteModal(false); setInviteStatus(''); }}
                  className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-xs font-bold transition-colors text-white"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}