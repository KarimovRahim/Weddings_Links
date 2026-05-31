/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import InvitationView from './components/InvitationView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route redirects to admin */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
        
        {/* Admin platform */}
        <Route path="/admin" element={<AdminDashboard />} />
        
        {/* Public personalized invitation */}
        <Route path="/invite/:id" element={<InvitationView />} />
      </Routes>
    </BrowserRouter>
  );
}
