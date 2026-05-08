import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, updateDoc, onSnapshot, where, increment, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Plus, Users, UserCheck, Trash2 } from 'lucide-react';

interface Booth {
  id: string;
  name: string;
  electionId: string;
  officerId: string;
  constituency: string;
  turnout: number;
  totalVoters: number;
}

interface UserData {
  id: string;
  email: string;
}

interface ElectionData {
  id: string;
  title: string;
}

export function BoothManagement() {
  const { user, role } = useAuth();
  const [booths, setBooths] = useState<Booth[]>([]);
  const [officers, setOfficers] = useState<UserData[]>([]);
  const [elections, setElections] = useState<ElectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // form state
  const [showForm, setShowForm] = useState(false);
  const [editingBoothId, setEditingBoothId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    electionId: '',
    officerId: '',
    constituency: 'Global',
    totalVoters: 0
  });

  useEffect(() => {
    if (!user) return;

    let q = query(collection(db, 'booths'));
    if (role === 'election_officer') {
      q = query(collection(db, 'booths'), where('officerId', '==', user.uid));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Booth[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Booth);
      });
      setBooths(data);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'booths');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, role]);

  useEffect(() => {
    if (role !== 'admin' && role !== 'election_officer') return;
    const fetchSelectData = async () => {
      try {
        const offQuery = query(collection(db, 'users'), where('role', '==', 'election_officer'));
        const offSnap = await getDocs(offQuery);
        const offData: UserData[] = [];
        offSnap.forEach((doc) => {
          offData.push({ id: doc.id, email: doc.data().email });
        });
        setOfficers(offData);

        const eleQuery = query(collection(db, 'elections'));
        const eleSnap = await getDocs(eleQuery);
        const eleData: ElectionData[] = [];
        eleSnap.forEach((doc) => {
          eleData.push({ id: doc.id, title: doc.data().title });
        });
        setElections(eleData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSelectData();
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (role !== 'admin' && role !== 'election_officer')) return;
    if (!formData.officerId) {
      setError('Please assign an election officer to this booth.');
      return;
    }
    setError('');

    try {
      if (editingBoothId) {
        await updateDoc(doc(db, 'booths', editingBoothId), {
          name: formData.name,
          electionId: formData.electionId,
          officerId: formData.officerId,
          constituency: formData.constituency,
          totalVoters: Number(formData.totalVoters) || 0
        });
      } else {
        const boothId = crypto.randomUUID();
        await setDoc(doc(db, 'booths', boothId), {
          name: formData.name,
          electionId: formData.electionId,
          officerId: formData.officerId,
          constituency: formData.constituency,
          turnout: 0,
          totalVoters: Number(formData.totalVoters) || 0
        });
      }
      setShowForm(false);
      setEditingBoothId(null);
      setFormData({ name: '', electionId: '', officerId: '', constituency: 'Global', totalVoters: 0 });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleManualTurnoutIncrement = async (boothId: string) => {
    try {
      await updateDoc(doc(db, 'booths', boothId), {
        turnout: increment(1)
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteBooth = async (id: string) => {
    if (!window.confirm('Delete this booth?')) return;
    try {
      await deleteDoc(doc(db, 'booths', id));
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete booth.');
    }
  };

  if (loading) return <div className="text-center py-10">Loading booths...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Booth Management</h1>
           <p className="text-slate-500 dark:text-slate-400 mt-1">Manage polling booths and view turnout stats.</p>
        </div>
         {(role === 'admin' || role === 'election_officer') && (
          <button
            onClick={() => {
              setEditingBoothId(null);
              setFormData({ name: '', electionId: '', officerId: '', constituency: 'Global', totalVoters: 0 });
              setShowForm(!showForm);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Booth
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800/50">
          {error}
        </div>
      )}

      {showForm && (role === 'admin' || role === 'election_officer') && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
          <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">{editingBoothId ? 'Update Booth' : 'Create New Booth'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Booth Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Election</label>
                <select
                  required
                  value={formData.electionId}
                  onChange={e => setFormData({...formData, electionId: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                >
                  <option value="" className="dark:bg-slate-800">Select Election...</option>
                  {elections.map(e => <option key={e.id} value={e.id} className="dark:bg-slate-800">{e.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assigned Officer</label>
                <select
                  required
                  value={formData.officerId}
                  onChange={e => setFormData({...formData, officerId: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                >
                  <option value="" className="dark:bg-slate-800">Select Officer...</option>
                  {officers.map(o => <option key={o.id} value={o.id} className="dark:bg-slate-800">{o.email}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Constituency</label>
                <input
                  type="text"
                  required
                  value={formData.constituency}
                  onChange={e => setFormData({...formData, constituency: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Registered Voters (approx)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.totalVoters}
                  onChange={e => setFormData({...formData, totalVoters: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => {
                setShowForm(false);
                setEditingBoothId(null);
                setFormData({ name: '', electionId: '', officerId: '', constituency: 'Global', totalVoters: 0 });
              }} className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">{editingBoothId ? 'Update Booth' : 'Save Booth'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {booths.length === 0 ? (
          <div className="col-span-full py-10 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
             <p className="text-slate-500 dark:text-slate-400">No booths found. Admins can create booths to assign to officers.</p>
          </div>
        ) : booths.map((booth) => (
          <div key={booth.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
             
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <UserCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            
            {(role === 'admin' || role === 'election_officer') && (
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingBoothId(booth.id);
                    setFormData({
                      name: booth.name,
                      electionId: booth.electionId,
                      officerId: booth.officerId,
                      constituency: booth.constituency || 'Global',
                      totalVoters: booth.totalVoters || 0
                    });
                    setShowForm(true);
                  }}
                  className="text-slate-400 hover:text-indigo-500 transition-colors"
                  title="Edit Booth"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button
                  onClick={() => handleDeleteBooth(booth.id)}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                  title="Delete Booth"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{booth.name}</h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-4 border border-slate-200 dark:border-slate-700">
               {booth.constituency}
            </span>
            
            <div className="w-full grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 mb-4">
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Turnout</p>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{booth.turnout}</div>
              </div>
              <div className="text-center border-l border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Total</p>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{booth.totalVoters}</div>
              </div>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mb-4 overflow-hidden">
               <div 
                 className="bg-indigo-600 h-full rounded-full transition-all" 
                 style={{ width: `${booth.totalVoters > 0 ? Math.min((booth.turnout / booth.totalVoters) * 100, 100) : 0}%` }}
               />
            </div>

            {(role === 'admin' || role === 'election_officer') && (
              <button 
                onClick={() => handleManualTurnoutIncrement(booth.id)}
                className="w-full py-2.5 bg-slate-50 dark:bg-slate-800/50 text-indigo-700 dark:text-indigo-400 text-sm font-medium border border-indigo-200 dark:border-indigo-800/50 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 transition"
              >
                + Increment Turnout
              </button>
            )}
            
          </div>
        ))}
      </div>
    </div>
  );
}
