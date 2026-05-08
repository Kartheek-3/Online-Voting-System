import React, { useState, useEffect } from 'react';
import { collection, query, addDoc, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { FileText, Save, ShieldCheck } from 'lucide-react';

interface Election {
  id: string;
  title: string;
  status: string;
}

export function CandidateNomination() {
  const { user, isVerified, role } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [manifesto, setManifesto] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchElections = async () => {
      const q = query(collection(db, 'elections'), where('status', '==', 'Not Started'));
      const snapshot = await getDocs(q);
      const elList: Election[] = [];
      snapshot.forEach(doc => {
        elList.push({ id: doc.id, ...doc.data() } as Election);
      });
      setElections(elList);
      if (elList.length > 0) {
        setSelectedElectionId(elList[0].id);
      }
    };
    fetchElections();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!isVerified && user.email !== 'admin@gmail.com' && role !== 'admin' && role !== 'election_officer')) {
      alert("You need to be a verified user to nominate yourself.");
      return;
    }
    setLoading(true);

    try {
      await addDoc(collection(db, 'candidates'), {
        name,
        description,
        manifesto,
        imageUrl: '',
        votes: 0,
        electionId: selectedElectionId,
        userId: user.uid,
        status: 'Pending',
      });
      setSuccess(true);
      setName('');
      setDescription('');
      setManifesto('');
    } catch (err) {
      console.error(err);
      alert('Failed to submit nomination.');
    } finally {
      setLoading(false);
    }
  };

  const isExemptFromVerification = user?.email === 'admin@gmail.com' || role === 'admin' || role === 'election_officer';

  if (!isVerified && !isExemptFromVerification) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center bg-amber-50 dark:bg-amber-900/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-800/50">
          <ShieldCheck className="w-12 h-12 text-amber-500 dark:text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-amber-800 dark:text-amber-300 mb-2">Verification Pending</h2>
          <p className="text-amber-700 dark:text-amber-400">Your account needs to be verified by an admin before you can submit a candidate nomination.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-3 tracking-tight">Candidate Nomination</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">Nominate yourself for up-coming elections.</p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 rounded-xl">
          <h3 className="font-semibold mb-1">Nomination Submitted</h3>
          <p className="text-sm">Your nomination has been successfully submitted and is awaiting admin approval.</p>
          <button onClick={() => setSuccess(false)} className="mt-3 text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:underline">Submit another?</button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 border text-left border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Select Election</label>
            <select
              required
              value={selectedElectionId}
              onChange={(e) => setSelectedElectionId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
            >
              {elections.length === 0 && <option value="" disabled className="dark:bg-slate-800">No upcoming elections available</option>}
              {elections.map((election) => (
                <option key={election.id} value={election.id} className="dark:bg-slate-800">
                  {election.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name (as it will appear on ballot)</label>
            <input
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
              placeholder="E.g., Jane Doe"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Short Description / Slogan</label>
             <input
               type="text"
               required
               maxLength={150}
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
               placeholder="Short pitch or department (e.g. For a Better Campus)"
             />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Manifesto (Detailed Platform)</label>
            <textarea
               required
               maxLength={4500}
               value={manifesto}
               onChange={(e) => setManifesto(e.target.value)}
               className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition min-h-[160px] resize-y"
               placeholder="Write your detailed manifesto here..."
             />
          </div>

          <button
            type="submit"
            disabled={loading || elections.length === 0}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Submitting...' : <>
              <Save className="w-5 h-5" /> Submit Nomination
            </>}
          </button>
        </form>
      </div>
    </div>
  );
}
