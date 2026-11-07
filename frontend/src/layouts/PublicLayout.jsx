import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';

const PublicLayout = () => {
  return (
    <div
      className="public-site-wrapper"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        margin: 0,
        padding: 0,
        overflowX: 'hidden',
      }}
    >
      <Header />
      <main style={{ flex: 1, width: '100%' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
