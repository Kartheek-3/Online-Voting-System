import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { CheckCircle, XCircle, Shield, Search } from 'lucide-react';

interface Voter {
  id: string;
  email: string;
  role: string;
  constituency: string;
  studentId: string;
  isVerified: boolean;
  createdAt: string;
}

export function VoterVerification() {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const vList: Voter[] = [];
        snapshot.forEach((doc) => {
          vList.push({ id: doc.id, ...doc.data() } as Voter);
        });
        vList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setVoters(vList);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        isVerified: !currentStatus
      }, { merge: true });
    } catch (err) {
      console.error(err);
      alert('Failed to update verification status.');
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        role: newRole
      }, { merge: true });
    } catch (err) {
      console.error(err);
      alert('Failed to update role.');
    }
  };

  const filteredVoters = voters.filter(v => 
    v.role !== 'admin' &&
    (v.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     v.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     v.constituency?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-900 dark:text-white border-b dark:border-slate-800/80 pb-4 mb-2">
            <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Voter Verification
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Review and approve registered voters before they can participate in elections.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/80 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/30 flex items-center gap-4">
          <div className="relative flex-grow max-w-md">
             <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
             <input
               type="text"
               placeholder="Search by email, voter ID or constituency..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm text-slate-900 dark:text-slate-100"
             />
          </div>
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Total Pending: {filteredVoters.filter(v => !v.isVerified).length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs font-semibold">
                <th className="px-6 py-4">Voter ID / Student ID</th>
                <th className="px-6 py-4">Constituency</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {filteredVoters.map(v => (
                <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-mono text-sm font-medium text-slate-700 dark:text-slate-300">
                    {v.studentId || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-medium">
                    {v.constituency || 'Global'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {v.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    <select
                      value={v.role || 'voter'}
                      onChange={(e) => handleChangeRole(v.id, e.target.value)}
                      className="bg-transparent border border-slate-300 dark:border-slate-700 rounded p-1 text-sm outline-none"
                    >
                      <option value="voter">Voter</option>
                      <option value="election_officer">Election Officer</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-500">
                    {new Date(v.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {v.isVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                        <CheckCircle className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                        <XCircle className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleToggleVerification(v.id, v.isVerified)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                        v.isVerified 
                          ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/50' 
                          : 'text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm'
                      }`}
                    >
                      {v.isVerified ? 'Revoke' : 'Verify'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredVoters.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No voters found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
