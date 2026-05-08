import React, { useEffect, useState } from 'react';
import { collection, doc, getDoc, onSnapshot, query, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, UserCircle2, AlertCircle, ShieldCheck, ArrowLeft, Clock } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

interface Candidate {
  id: string;
  name: string;
  description: string;
  manifesto?: string;
  imageUrl?: string;
  votes: number;
  status?: string;
  electionId?: string;
}

export function VotingBoard() {
  const { user, constituency: userConstituency, isVerified, role } = useAuth();
  const { electionId } = useParams<{ electionId: string }>();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedCandidateId, setVotedCandidateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  
  const [electionTitle, setElectionTitle] = useState<string>('');
  const [electionStatus, setElectionStatus] = useState<string>('Not Started');
  const [electionStartTime, setElectionStartTime] = useState<string>('');
  const [electionEndTime, setElectionEndTime] = useState<string>('');

  const [electionConstituency, setElectionConstituency] = useState<string>('Global');

  const [expandIndex, setExpandIndex] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [candidateToVote, setCandidateToVote] = useState<Candidate | null>(null);
  
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

  const isExemptFromVerification = user?.email === 'admin@gmail.com' || role === 'admin' || role === 'election_officer';

  useEffect(() => {
    if (!electionEndTime || electionStatus !== 'Open') {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(electionEndTime).getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft(null);
        if (electionStatus === 'Open') {
          // You could automatically update the DB here, but typically it should be handled
          // by a cloud function or the admin. We'll simply update the local state for now.
          setElectionStatus('Closed'); 
        }
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [electionEndTime, electionStatus]);

  useEffect(() => {
    if (!user || !electionId) return;

    // Listen to election settings
    const unsubscribeSettings = onSnapshot(doc(db, 'elections', electionId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setElectionTitle(data.title || 'Untitled Election');
        if (data.status) setElectionStatus(data.status);
        if (data.startTime) setElectionStartTime(data.startTime);
        if (data.endTime) setElectionEndTime(data.endTime);
        setElectionConstituency(data.constituency || 'Global');
      } else {
         setError("Election not found.");
      }
    });

    // Listen to real-time candidates
    const q = query(collection(db, 'candidates'));
    const unsubscribeCandidates = onSnapshot(
      q,
      (snapshot) => {
        const cands: Candidate[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as Candidate;
          if (data.electionId === electionId && (!data.status || data.status === 'Approved')) {
             cands.push({ id: doc.id, ...data });
          }
        });
        // Sort by name
        cands.sort((a, b) => a.name.localeCompare(b.name));
        setCandidates(cands);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'candidates');
      }
    );

    // Check if the user has already voted
    const checkVoteStatus = async () => {
      try {
        const voterLogId = `${user.uid}_${electionId}`;
        const voterLogDoc = await getDoc(doc(db, 'voter_log', voterLogId));
        if (voterLogDoc.exists()) {
          setHasVoted(true);
        }
      } catch (error: any) {
        if(error?.code !== 'permission-denied') {
          handleFirestoreError(error, OperationType.GET, `voter_log/${user.uid}_${electionId}`);
        }
      } finally {
        setLoading(false);
      }
    };

    checkVoteStatus();

    return () => {
      unsubscribeCandidates();
      unsubscribeSettings();
    };
  }, [user, electionId]);

  const handleVote = async (candidate: Candidate) => {
    console.log("HandleVote clicked for:", candidate.name);
    if (!user) { setError('Please log in to vote.'); return; }
    if (voting) { setError('Voting is in progress...'); return; }
    if (hasVoted) { setError('You have already voted in this election.'); return; }
    if (!electionId) { setError('Invalid election ID.'); return; }

    const isExemptFromVerification = user.email === 'admin@gmail.com' || role === 'admin' || role === 'election_officer';
    if (!isVerified && !isExemptFromVerification) {
      setError('You must be verified by an admin to cast a vote.');
      return;
    }
    if (electionStatus !== 'Open') {
      setError('The election is currently not open.');
      return;
    }

    setVoting(true);
    setError('');

    try {
      const batch = writeBatch(db);
      
      const voteId = `${user.uid}_${electionId}`;
      const voteRef = doc(db, 'votes', voteId);
      
      batch.set(voteRef, {
        candidateId: candidate.id,
        electionId: electionId,
        timestamp: serverTimestamp()
      });

      const candidateRef = doc(db, 'candidates', candidate.id);
      batch.update(candidateRef, {
        votes: increment(1)
      });
      
      const voterLogRef = doc(db, 'voter_log', voteId);
      batch.set(voterLogRef, {
        timestamp: serverTimestamp()
      });

      await batch.commit();

      setHasVoted(true);
      setVotedCandidateId(candidate.id);
    } catch (err: any) {
      console.error("Vote failed:", err);
      // Try to extract a meaningful error message
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Vote failed: ${errorMessage}`);
    } finally {
      setVoting(false);
      console.log("Voting finished.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6">
         <button onClick={() => navigate('/')} className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition text-sm font-medium">
             <ArrowLeft className="w-4 h-4 mr-1"/> Back to Elections
         </button>
      </div>
      <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-3 tracking-tight">
             {electionTitle || 'Election Candidates'}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mb-2">Review the candidates and cast your vote securely. Ensure your choice is final, as you can only vote once in this election.</p>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full font-medium text-xs border border-slate-200 dark:border-slate-700">
               Constituency: {electionConstituency}
            </div>
            {timeLeft && electionStatus === 'Open' && (
              <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-4 py-1.5 rounded-full font-medium text-sm border border-indigo-200 dark:border-indigo-800/50 shadow-sm animate-pulse">
                <Clock className="w-4 h-4" />
                <span>
                  Ends in: {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
                </span>
              </div>
            )}
            {electionStatus === 'Closed' && (
              <div className="inline-flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 px-4 py-1.5 rounded-full font-medium text-sm border border-rose-200 dark:border-rose-800/50 shadow-sm">
                Election Closed
              </div>
            )}
          </div>
        </div>
        {!hasVoted && electionStatus === 'Open' && (
          <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-full font-medium text-sm border border-amber-200 dark:border-amber-800/50 shadow-sm whitespace-nowrap">
            <ShieldCheck className="w-4 h-4" />
            Your vote is secure & anonymous
          </div>
        )}
      </div>

      {electionStatus !== 'Open' && (
        <div className="mb-8 p-5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-slate-500 dark:text-slate-400" />
          <p className="text-sm font-medium">
            The election is currently <strong>{electionStatus}</strong>.
            {electionStatus === 'Not Started' && electionStartTime && ` It will open at ${new Date(electionStartTime).toLocaleString()}.`}
            {electionStatus === 'Closed' && ' Voting is no longer allowed.'}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-8 p-5 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800/50 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {hasVoted && (
        <div className="mb-10 p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-5 shadow-sm transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-emerald-500 dark:bg-emerald-600 rounded-full p-3 text-white flex-shrink-0 shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-emerald-900 dark:text-emerald-400 font-bold text-xl mb-1">Your vote has been recorded!</h3>
            <p className="text-emerald-700 dark:text-emerald-300 text-base">Thank you for participating in the democratic process. Check the dashboard to view overall results.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {candidates.map((candidate) => {
          const isSelected = votedCandidateId === candidate.id;
          return (
            <div 
              key={candidate.id} 
              className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300
                ${isSelected ? 'border-2 border-emerald-500 ring-4 ring-emerald-500/10 scale-[1.02]' : 'border border-slate-200 dark:border-slate-700'}
                ${!hasVoted ? 'hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500 hover:-translate-y-1' : 'opacity-90'}`}
            >
              <div className="p-6 sm:p-8 flex-1 flex flex-col items-center text-center">
                <div className="w-24 h-24 mb-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-md relative">
                  <UserCircle2 className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                  {isSelected && (
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{candidate.name}</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">{candidate.description}</p>
                
                {candidate.manifesto && (
                  <div className="w-full mb-4">
                    <button 
                      onClick={() => setExpandIndex(expandIndex === candidate.id ? null : candidate.id)}
                      className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 w-full text-center py-1 transition-colors"
                    >
                      {expandIndex === candidate.id ? 'Hide Manifesto' : 'Read Manifesto'}
                    </button>
                    {expandIndex === candidate.id && (
                      <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-left text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
                        {candidate.manifesto}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Spacer to push button to bottom */}
                <div className="flex-grow"></div>
              </div>
              
              <div className="px-6 py-5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-3">
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Total Votes
                  </span>
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs">
                    {candidate.votes || 0} {candidate.votes === 1 ? 'Vote' : 'Votes'}
                  </span>
                </div>

                {!hasVoted ? (
                  <button
                    onClick={() => { setCandidateToVote(candidate); setShowConfirmModal(true); }}
                    disabled={voting || electionStatus !== 'Open' || (electionConstituency !== 'Global' && electionConstituency !== userConstituency && role !== 'admin' && role !== 'election_officer') || (!isVerified && !isExemptFromVerification)}
                    className="w-full py-3.5 px-4 bg-indigo-600 text-white rounded-xl font-semibold text-base hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                  >
                    <span>
                      {electionStatus === 'Not Started' ? 'Election Not Started' : 
                       electionStatus === 'Closed' ? 'Election Closed' : 
                       (electionConstituency !== 'Global' && electionConstituency !== userConstituency && role !== 'admin' && role !== 'election_officer') ? `Restricted to ${electionConstituency}` :
                       (!isVerified && !isExemptFromVerification) ? 'Pending Admin Verification' :
                       `Vote for ${candidate.name}`}
                    </span>
                    {electionStatus === 'Open' && (electionConstituency === 'Global' || electionConstituency === userConstituency || role === 'admin' || role === 'election_officer') && (isVerified || isExemptFromVerification) && (
                      <svg className={`w-5 h-5 opacity-0 ${voting ? '' : '-ml-5 group-hover:opacity-100 group-hover:ml-0'} transition-all duration-300`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ) : null}
                
                {isSelected && (
                  <div className="text-center mt-2">
                     <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> 
                      You voted for this candidate
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {candidates.length === 0 && (
          <div className="col-span-full py-16 text-center bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
            <UserCircle2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Candidates Yet</h3>
            <p className="text-slate-500 dark:text-slate-400">The election administrator hasn't added any candidates.</p>
          </div>
        )}
      </div>

      {showConfirmModal && candidateToVote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Confirm Vote</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Are you sure you want to vote for <strong>{candidateToVote.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowConfirmModal(false);
                  handleVote(candidateToVote);
                }}
                className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Confirm Vote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
