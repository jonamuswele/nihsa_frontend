import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicApp from './PublicApp';
import AdminApp from './AdminApp';

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicApp />} />
      <Route path="/admin/*" element={<AdminApp />} />
    </Routes>
  );
}

export default App;
