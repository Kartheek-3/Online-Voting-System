import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, ShieldCheck, Activity, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Election {
  id: string;
  title: string;
  status: string;
  startTime: string;
  endTime: string;
  constituency?: string;
}

export function ElectionList() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, constituency, isVerified, role } = useAuth();

  useEffect(() => {
    const qElections = query(collection(db, 'elections'));
    const unsubElections = onSnapshot(
      qElections,
      (snapshot) => {
        const elecs: Election[] = [];
        snapshot.forEach((doc) => elecs.push({ id: doc.id, ...doc.data() } as Election));
        // Sort by start time descending (newest first)
        elecs.sort((a,b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());
        setElections(elecs);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'elections');
        setLoading(false);
      }
    );
    return () => unsubElections();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isExemptFromVerification = user?.email === 'admin@gmail.com' || role === 'admin' || role === 'election_officer';

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-3 tracking-tight">Active Elections</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">Participate in democratic processes securely and view real-time results.</p>
        </div>
      </div>

      {!isVerified && !isExemptFromVerification && (
        <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">Voter Verification Pending</h3>
            <p className="text-sm mt-1 opacity-90">Your account is currently under review by the election administrators. You will be able to cast votes once your Student/Voter ID is verified.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {elections.map((election) => (
          <div key={election.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{election.title}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                election.status === 'Open' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 
                election.status === 'Closed' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' : 
                'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-700/50 dark:text-slate-400 dark:border-slate-600'
              }`}>
                {election.status}
              </span>
            </div>
            
            <div className="space-y-2 mb-6 flex-grow">
               <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                 <Users className="w-4 h-4" />
                 Constituency: {election.constituency || 'Global'}
               </p>
               {election.startTime && (
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> 
                  Opens: {new Date(election.startTime).toLocaleString()}
                </p>
               )}
               {election.endTime && (
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> 
                  Closes: {new Date(election.endTime).toLocaleString()}
                </p>
               )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-700 mt-auto">
              {election.status === 'Open' && (
                 (!isVerified && !isExemptFromVerification) ? (
                   <button 
                     disabled
                     className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 rounded-xl text-center font-medium flex items-center justify-center gap-2 cursor-not-allowed"
                     title="Pending admin verification"
                   >
                     <ShieldCheck className="w-4 h-4" /> Verification Pending
                   </button>
                 ) : (!election.constituency || election.constituency === 'Global' || election.constituency === constituency || role === 'admin' || role === 'election_officer') ? (
                   <Link 
                     to={`/elections/${election.id}/vote`}
                     className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-center font-medium transition flex items-center justify-center gap-2"
                   >
                     <ShieldCheck className="w-4 h-4" /> Cast Vote
                   </Link>
                 ) : (
                   <button 
                     disabled
                     className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 rounded-xl text-center font-medium flex items-center justify-center gap-2 cursor-not-allowed"
                     title="You do not belong to this constituency"
                   >
                     <ShieldCheck className="w-4 h-4" /> Restricted Region
                   </button>
                 )
              )}
              <Link 
                 to={`/elections/${election.id}/results`}
                 className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-center font-medium transition flex items-center justify-center gap-2"
               >
                 <Activity className="w-4 h-4" /> View Results
              </Link>
            </div>
          </div>
        ))}

        {elections.length === 0 && (
           <div className="col-span-full py-16 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">No elections found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
