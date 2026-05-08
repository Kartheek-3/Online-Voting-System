import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, setDoc, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend as ChartLegend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Trash2, UserPlus, Users, Vote, Activity, Plus, Settings, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  ChartLegend,
  ArcElement
);

interface Election {
  id: string;
  title: string;
  status: string;
  startTime: string;
  endTime: string;
}

interface Candidate {
  id: string;
  name: string;
  description: string;
  manifesto?: string;
  votes: number;
  imageUrl?: string;
  electionId: string;
  status: string;
}

const COLORS = [
  'rgba(99, 102, 241, 0.8)', // indigo-500
  'rgba(168, 85, 247, 0.8)', // purple-500
  'rgba(236, 72, 153, 0.8)', // pink-500
  'rgba(244, 63, 94, 0.8)',  // rose-500
  'rgba(249, 115, 22, 0.8)', // orange-500
  'rgba(234, 179, 8, 0.8)',  // yellow-500
  'rgba(34, 197, 94, 0.8)',  // green-500
  'rgba(6, 182, 212, 0.8)',  // cyan-500
];

const BORDER_COLORS = [
  'rgb(99, 102, 241)',
  'rgb(168, 85, 247)',
  'rgb(236, 72, 153)',
  'rgb(244, 63, 94)',
  'rgb(249, 115, 22)',
  'rgb(234, 179, 8)',
  'rgb(34, 197, 94)',
  'rgb(6, 182, 212)',
];

export function AdminDashboard() {
  const { role } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  
  // New Election Form
  const [newElectionTitle, setNewElectionTitle] = useState('');
  const [newElectionStatus, setNewElectionStatus] = useState('Not Started');
  const [newElectionStartTime, setNewElectionStartTime] = useState('');
  const [newElectionEndTime, setNewElectionEndTime] = useState('');
  const [newElectionConstituency, setNewElectionConstituency] = useState('Global');
  const [creatingElection, setCreatingElection] = useState(false);

  // New Candidate Form
  const [newCandidateName, setNewCandidateName] = useState('');
  const [newCandidateDesc, setNewCandidateDesc] = useState('');
  const [loading, setLoading] = useState(false);

  // Selected Election Edit Form
  const [electionStatus, setElectionStatus] = useState('Not Started');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [electionConstituency, setElectionConstituency] = useState('Global');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  useEffect(() => {
    const qElections = query(collection(db, 'elections'));
    const unsubElections = onSnapshot(
      qElections,
      (snapshot) => {
        const elecs: Election[] = [];
        snapshot.forEach((doc) => elecs.push({ id: doc.id, ...doc.data() } as Election));
        setElections(elecs);
        if (elecs.length > 0 && !selectedElectionId) {
          setSelectedElectionId(elecs[0].id);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'elections')
    );
    return () => unsubElections();
  }, [selectedElectionId]);

  useEffect(() => {
    if (!selectedElectionId) return;
    
    const selected = elections.find(e => e.id === selectedElectionId);
    if (selected) {
      setElectionStatus(selected.status || 'Not Started');
      setStartTime(selected.startTime || '');
      setEndTime(selected.endTime || '');
      setElectionConstituency(selected.constituency || 'Global');
    }

    const qCandidates = query(collection(db, 'candidates'));
    const unsubCandidates = onSnapshot(
      qCandidates,
      (snapshot) => {
        const cands: Candidate[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as Candidate;
          if (data.electionId === selectedElectionId) {
             cands.push({ id: doc.id, ...data });
          }
        });
        setCandidates(cands);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'candidates')
    );

    return () => unsubCandidates();
  }, [selectedElectionId, elections]);

  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newElectionTitle.trim()) return;
    
    if (newElectionStartTime && newElectionEndTime && new Date(newElectionEndTime) <= new Date(newElectionStartTime)) {
      alert('End time must be after start time.');
      return;
    }

    setCreatingElection(true);
    try {
      const docRef = await addDoc(collection(db, 'elections'), {
        title: newElectionTitle.trim(),
        status: newElectionStatus,
        startTime: newElectionStartTime,
        endTime: newElectionEndTime,
        constituency: newElectionConstituency.trim() || 'Global'
      });
      setSelectedElectionId(docRef.id);
      setNewElectionTitle('');
      setNewElectionStartTime('');
      setNewElectionEndTime('');
      setNewElectionConstituency('Global');
    } catch (err) {
      console.error(err);
      alert('Failed to create election.');
    } finally {
      setCreatingElection(false);
    }
  };

  const handleDeleteElection = async (id: string) => {
    if(!window.confirm('Delete election? This will not cascade delete candidates or votes.')) return;
    try {
      await deleteDoc(doc(db, 'elections', id));
      if (selectedElectionId === id) setSelectedElectionId('');
    } catch(e) {
      console.error(e);
      alert('Failed to delete');
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedElectionId) return;

    setSettingsLoading(true);
    setSettingsError('');

    try {
      await updateDoc(doc(db, 'elections', selectedElectionId), {
        status: electionStatus,
        startTime,
        endTime,
        constituency: electionConstituency,
      });
      alert('Settings updated successfully');
    } catch (error: any) {
      setSettingsError(error.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedElectionId) {
      alert("Please select an election first");
      return;
    }
    if (!newCandidateName.trim() || !newCandidateDesc.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'candidates'), {
        name: newCandidateName.trim(),
        description: newCandidateDesc.trim(),
        imageUrl: '',
        votes: 0,
        electionId: selectedElectionId,
        status: 'Approved'
      });
      setNewCandidateName('');
      setNewCandidateDesc('');
    } catch (err) {
      console.error(err);
      alert('Failed to add candidate. Ensure you have admin rights.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This might break votes attached to this candidate.`)) return;
    try {
      await deleteDoc(doc(db, 'candidates', id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete candidate.');
    }
  };

  const handleUpdateCandidateStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Approved' ? 'Pending' : 'Approved';
    try {
      await setDoc(doc(db, 'candidates', id), { status: newStatus }, { merge: true });
    } catch (err) {
      console.error(err);
      alert('Failed to update candidate status.');
    }
  };

  const [expandIndex, setExpandIndex] = useState<string | null>(null);

  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);

  const barChartData = {
    labels: candidates.map(c => c.name),
    datasets: [
      {
        label: 'Votes',
        data: candidates.map(c => c.votes),
        backgroundColor: COLORS,
        borderColor: BORDER_COLORS,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: '#e2e8f0',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            const value = context.raw || 0;
            const percentage = totalVotes > 0 ? ((value / totalVotes) * 100).toFixed(1) : 0;
            return `Votes: ${value} (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#94a3b8'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#94a3b8',
          stepSize: 1,
        },
        beginAtZero: true,
      }
    }
  };

  const doughnutData = {
    labels: candidates.filter(c => c.votes > 0).map(c => c.name),
    datasets: [
      {
        data: candidates.filter(c => c.votes > 0).map(c => c.votes),
        backgroundColor: COLORS,
        borderColor: '#1e293b', // match dark card bg
        borderWidth: 2,
        hoverOffset: 4
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#e2e8f0',
          padding: 20,
          font: { family: "'Inter', sans-serif" }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: '#e2e8f0',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = totalVotes > 0 ? ((value / totalVotes) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '70%',
  };

  return (
    <div className="-mx-4 -mx-6 -my-8 px-4 sm:px-6 lg:px-8 py-8 bg-slate-950 min-h-[calc(100vh-64px)] text-slate-200 font-sans shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Activity className="w-8 h-8 text-indigo-500" />
                Live Dashboard
              </h1>
              {selectedElectionId && (
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  electionStatus === 'Open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                  electionStatus === 'Closed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                  'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}>
                  {electionStatus}
                </div>
              )}
            </div>
            <p className="text-slate-400 mb-2">Monitor election activities and manage candidate records in real-time.</p>
            {selectedElectionId && (startTime || endTime) && (
              <div className="flex items-center gap-4 text-sm text-slate-500">
                {startTime && <p>Opens: <span className="text-slate-300">{new Date(startTime).toLocaleString()}</span></p>}
                {endTime && <p>Closes: <span className="text-slate-300">{new Date(endTime).toLocaleString()}</span></p>}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-4 pr-6">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Vote className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Ballots</p>
                <p className="text-2xl font-bold text-white">{totalVotes}</p>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-4 pr-6">
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Candidates</p>
                <p className="text-2xl font-bold text-white">{candidates.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Elections Selector & Creator */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
             <h2 className="text-xl font-bold text-white mb-4">Select Election</h2>
             <select 
               value={selectedElectionId} 
               onChange={(e) => setSelectedElectionId(e.target.value)}
               className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none"
             >
                {elections.length === 0 && <option value="" disabled>No elections found</option>}
                {elections.map((election) => (
                  <option key={election.id} value={election.id}>
                    {election.title} ({election.status})
                  </option>
                ))}
             </select>
             {selectedElectionId && role === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleDeleteElection(selectedElectionId)}
                  className="mt-4 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-sm font-medium transition"
                >
                  Delete Selected Election
                </button>
             )}
          </div>
          {role === 'admin' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
             <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Create New Election
             </h2>
             <form onSubmit={handleCreateElection} className="space-y-4">
                <input
                  type="text"
                  required
                  placeholder="Election Title (e.g. 2024 Presidential)"
                  value={newElectionTitle}
                  onChange={(e) => setNewElectionTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                />
                <div className="flex gap-4">
                  <input
                    type="datetime-local"
                    value={newElectionStartTime}
                    onChange={(e) => setNewElectionStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none [color-scheme:dark]"
                  />
                  <input
                    type="datetime-local"
                    value={newElectionEndTime}
                    onChange={(e) => setNewElectionEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none [color-scheme:dark]"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Constituency (e.g. Computer Science Dept)"
                  value={newElectionConstituency}
                  onChange={(e) => setNewElectionConstituency(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                />
                <button
                  type="submit"
                  disabled={creatingElection}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition"
                >
                  {creatingElection ? 'Creating...' : 'Create Election'}
                </button>
             </form>
          </div>
          )}
        </div>

        {selectedElectionId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content: Charts */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Bar Chart Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Voting Analytics</h2>
              </div>
              <div className="h-[360px] w-full">
                {candidates.length > 0 ? (
                  <Bar data={barChartData} options={barChartOptions} />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    Awaiting Candidate Data...
                  </div>
                )}
              </div>
            </div>

            {/* Doughnut Chart Row */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
               <h2 className="text-xl font-bold text-white mb-6">Vote Share Distribution</h2>
               <div className="h-[300px] w-full flex items-center justify-center">
                {totalVotes > 0 ? (
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                ) : (
                  <div className="text-slate-500">No votes cast yet.</div>
                )}
              </div>
            </div>

          </div>

          {/* Sidebar: Candidate Management & Settings */}
          <div className="space-y-6">
            
            {/* Election Settings Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-4 mb-5 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                Election Settings
              </h2>
              <form onSubmit={handleUpdateSettings} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
                  <select
                    value={electionStatus}
                    onChange={(e) => setElectionStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Start Time</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">End Time</label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Constituency</label>
                  <input
                    type="text"
                    value={electionConstituency}
                    onChange={(e) => setElectionConstituency(e.target.value)}
                    placeholder="Global"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  />
                </div>
                {settingsError && (
                  <div className="text-sm text-rose-500 font-medium bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                    {settingsError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition duration-200 disabled:opacity-50"
                >
                  {settingsLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </form>
            </div>

            {/* Add Candidate Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-4 mb-5 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Enroll Candidate
              </h2>
              <form onSubmit={handleAddCandidate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Candidate Name</label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={newCandidateName}
                    onChange={(e) => setNewCandidateName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition placeholder-slate-600"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Description / Manifesto</label>
                  <textarea
                    required
                    maxLength={200}
                    value={newCandidateDesc}
                    onChange={(e) => setNewCandidateDesc(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition min-h-[120px] placeholder-slate-600 resize-none"
                    placeholder="Brief platform overview..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Processing...' : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Add Candidate
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Candidate List */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-4 mb-4">Registry</h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {candidates.map(candidate => {
                  const percentage = totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(1) : '0.0';
                  return (
                  <div key={candidate.id} className="flex flex-col bg-slate-950/50 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors group">
                    <div className="flex justify-between items-center p-4">
                      <div 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => setExpandIndex(expandIndex === candidate.id ? null : candidate.id)}
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-indigo-400 overflow-hidden border border-slate-700 flex-shrink-0">
                          {candidate.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-200">{candidate.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-slate-500">
                              {candidate.votes} {candidate.votes === 1 ? 'vote' : 'votes'} <span className="text-slate-600 ml-1">({percentage}%)</span>
                            </p>
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full ${candidate.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : candidate.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                              {candidate.status || 'Approved'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 transition-opacity">
                        <button
                          onClick={() => handleUpdateCandidateStatus(candidate.id, candidate.status || 'Approved')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold ${candidate.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'}`}
                          title={candidate.status === 'Approved' ? 'Revoke Approval' : 'Approve Candidate'}
                        >
                          <CheckCircle className="w-3 h-3" />
                          {candidate.status === 'Approved' ? 'Approved' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleDelete(candidate.id, candidate.name)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete Candidate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {expandIndex === candidate.id && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-800/50 text-sm text-slate-400">
                        <p className="mb-2"><strong className="text-slate-300 block mb-1">Description:</strong> {candidate.description}</p>
                        {candidate.manifesto && (
                          <div className="mt-3">
                            <strong className="text-slate-300 block mb-1">Manifesto:</strong>
                            <div className="p-3 bg-slate-900 rounded-lg max-h-40 overflow-y-auto custom-scrollbar text-xs leading-relaxed whitespace-pre-wrap">
                              {candidate.manifesto}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )})}
                {candidates.length === 0 && (
                  <div className="text-center text-sm text-slate-500 py-8 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
                    No candidates registered.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
        )}
      </div>
    </div>
  );
}
