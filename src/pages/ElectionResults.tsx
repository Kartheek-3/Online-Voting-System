import React, { useEffect, useState, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend as ChartLegend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Activity, BarChart3, PieChart, Users, AlertCircle, ArrowLeft, Trophy } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useParams, useNavigate } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  ChartLegend,
  ArcElement
);

interface ResultRecord {
  name: string;
  votes: number;
  percentage: number;
  electionId: string;
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

export function ElectionResults() {
  const { electionId } = useParams<{ electionId: string }>();
  const navigate = useNavigate();
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [electionTitle, setElectionTitle] = useState('Election Results');
  const [electionConstituency, setElectionConstituency] = useState('Global');
  const [electionStatus, setElectionStatus] = useState('Open');

  useEffect(() => {
    if (!electionId) return;

    let unsubElection: (() => void) | undefined;
    let unsubCandidates: (() => void) | undefined;

    const setupListeners = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        const { collection, doc, query, where, onSnapshot } = await import('firebase/firestore');
        const { db, handleFirestoreError, OperationType } = await import('../lib/firebase');

        unsubElection = onSnapshot(doc(db, 'elections', electionId), (elecDoc) => {
          if (elecDoc.exists()) {
            setElectionTitle(elecDoc.data().title || 'Election Results');
            setElectionConstituency(elecDoc.data().constituency || 'Global');
            setElectionStatus(elecDoc.data().status || 'Open');
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'elections');
        });

        const q = query(collection(db, 'candidates'), where('electionId', '==', electionId));
        unsubCandidates = onSnapshot(q, (querySnapshot) => {
          let newTotalVotes = 0;
          const candidatesList: ResultRecord[] = [];

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.status && data.status !== 'Approved') return;
            const votes = data.votes || 0;
            newTotalVotes += votes;
            candidatesList.push({
              name: data.name,
              votes: votes,
              percentage: 0,
              electionId: data.electionId
            });
          });

          if (newTotalVotes > 0) {
            candidatesList.forEach(c => c.percentage = (c.votes / newTotalVotes) * 100);
          }

          // Sort by votes descending
          candidatesList.sort((a, b) => b.votes - a.votes);

          setResults(candidatesList);
          setTotalVotes(newTotalVotes);
          setError('');
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'candidates');
          setLoading(false);
        });

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred fetching results');
        setLoading(false);
      }
    };

    setupListeners();

    return () => {
      if (unsubElection) unsubElection();
      if (unsubCandidates) unsubCandidates();
    };
  }, [electionId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const barChartData = {
    labels: results.map(r => r.name),
    datasets: [
      {
        label: 'Votes',
        data: results.map(r => r.votes),
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
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1e293b',
        bodyColor: '#334155',
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
        },
        ticks: {
          color: '#64748b'
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#64748b',
          stepSize: 1,
        },
        beginAtZero: true,
      }
    }
  };

  const doughnutData = {
    labels: results.filter(r => r.votes > 0).map(r => r.name),
    datasets: [
      {
        data: results.filter(r => r.votes > 0).map(r => r.votes),
        backgroundColor: COLORS,
        borderColor: '#ffffff',
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
        position: 'bottom' as const,
        labels: {
          padding: 20,
          color: '#64748b',
          font: {
            size: 13
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1e293b',
        bodyColor: '#334155',
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

  const getWinnerInfo = () => {
    if (results.length === 0 || totalVotes === 0) return { name: "No votes yet", status: "N/A" };
    
    const highestVotes = results[0].votes;
    const leaders = results.filter(r => r.votes === highestVotes);
    
    if (leaders.length > 1) {
      return { 
        name: leaders.map(l => l.name).join(', '), 
        status: electionStatus === 'Closed' ? 'Tie' : 'Current Tie' 
      };
    }
    
    return { 
      name: leaders[0].name, 
      status: electionStatus === 'Closed' ? 'Winner' : 'Current Leader' 
    };
  };

  const winnerInfo = getWinnerInfo();

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6 flex justify-between items-center">
         <button onClick={() => navigate('/')} className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition text-sm font-medium">
             <ArrowLeft className="w-4 h-4 mr-1"/> Back to Elections
         </button>
      </div>
      <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-3 tracking-tight">{electionTitle}</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">View live, real-time results of the election.</p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-full font-medium border border-slate-200 dark:border-slate-700 shadow-sm whitespace-nowrap">
            <Users className="w-4 h-4" />
            Constituency: {electionConstituency}
          </div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-full font-medium border border-indigo-100 dark:border-indigo-800/50 shadow-sm whitespace-nowrap">
            <Activity className="w-5 h-5" />
            Live Updates Active
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-5 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800/50 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 p-4 rounded-xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Votes</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalVotes}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Candidates</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{results.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 p-4 rounded-xl">
            <Trophy className="w-8 h-8" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{winnerInfo.status}</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate max-w-full" title={winnerInfo.name}>{winnerInfo.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            Vote Distribution
          </h2>
          <div className="h-[400px]">
            {results.length > 0 ? (
              <Bar data={barChartData} options={barChartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">No data available</div>
            )}
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4 mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            Vote Share
          </h2>
          <div className="flex-1 min-h-[300px] flex items-center justify-center relative">
            {totalVotes > 0 ? (
              <>
                <div className="absolute z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">{totalVotes}</span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">Votes</span>
                </div>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </>
            ) : (
              <div className="text-slate-400">No votes cast yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
