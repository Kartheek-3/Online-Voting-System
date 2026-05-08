import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VotingBoard } from './pages/VotingBoard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ElectionResults } from './pages/ElectionResults';
import { ElectionList } from './pages/ElectionList';
import { VoterVerification } from './pages/VoterVerification';
import { CandidateNomination } from './pages/CandidateNomination';
import { BoothManagement } from './pages/BoothManagement';
import { Profile } from './pages/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<Layout />}>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<ElectionList />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/nominate" element={<CandidateNomination />} />
              <Route path="/elections/:electionId/vote" element={<VotingBoard />} />
              <Route path="/elections/:electionId/results" element={<ElectionResults />} />
            </Route>
            
            <Route element={<ProtectedRoute allowedRoles={['admin', 'election_officer']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/voters" element={<VoterVerification />} />
              <Route path="/admin/booths" element={<BoothManagement />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
