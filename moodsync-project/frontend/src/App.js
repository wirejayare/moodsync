import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import SpotifyCallback from './components/SpotifyCallback';
import PinterestCallback from './components/PinterestCallback';
import './App.css';

function App() {
  const [spotifyUser, setSpotifyUser] = useState(null);
  const [spotifyToken, setSpotifyToken] = useState(null);
  const [pinterestUser, setPinterestUser] = useState(null);
  const [pinterestToken, setPinterestToken] = useState(null);

  // Clear all sessions on every page refresh for clean, predictable experience
  useEffect(() => {
    console.log('🔄 Clearing all sessions on page refresh for clean experience');
    
    // Clear localStorage
    localStorage.removeItem('moodsync_spotify_user');
    localStorage.removeItem('moodsync_spotify_token');
    localStorage.removeItem('moodsync_pinterest_user');
    localStorage.removeItem('moodsync_pinterest_token');
    
    // Clear sessionStorage
    sessionStorage.removeItem('moodsync_spotify_user');
    sessionStorage.removeItem('moodsync_spotify_token');
    sessionStorage.removeItem('moodsync_pinterest_user');
    sessionStorage.removeItem('moodsync_pinterest_token');
    
    // Reset state to null
    setSpotifyUser(null);
    setSpotifyToken(null);
    setPinterestUser(null);
    setPinterestToken(null);
    
    console.log('✅ All sessions cleared - users must reconnect for fresh experience');
  }, []);

  const handleSpotifyAuth = (token, user) => {
    setSpotifyToken(token);
    setSpotifyUser(user);
    
    // Persist to localStorage for current session only
    localStorage.setItem('moodsync_spotify_token', token);
    localStorage.setItem('moodsync_spotify_user', JSON.stringify(user));
    
    console.log('Spotify authenticated and saved:', user.display_name);
  };

  const handlePinterestAuth = (token, user) => {
    setPinterestToken(token);
    setPinterestUser(user);
    
    // Persist to localStorage for current session only
    localStorage.setItem('moodsync_pinterest_token', token);
    localStorage.setItem('moodsync_pinterest_user', JSON.stringify(user));
    
    console.log('Pinterest authenticated and saved:', user.username);
  };

  const handleLogout = (service) => {
    if (service === 'spotify') {
      setSpotifyUser(null);
      setSpotifyToken(null);
      localStorage.removeItem('moodsync_spotify_user');
      localStorage.removeItem('moodsync_spotify_token');
    } else if (service === 'pinterest') {
      setPinterestUser(null);
      setPinterestToken(null);
      localStorage.removeItem('moodsync_pinterest_user');
      localStorage.removeItem('moodsync_pinterest_token');
    }
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              <Home
                spotifyUser={spotifyUser}
                spotifyToken={spotifyToken}
                onSpotifyAuth={handleSpotifyAuth}
                pinterestUser={pinterestUser}
                pinterestToken={pinterestToken}
                onPinterestAuth={handlePinterestAuth}
                onLogout={handleLogout}
              />
            } 
          />
          <Route 
            path="/callback" 
            element={
              <SpotifyCallback 
                onSpotifyAuth={handleSpotifyAuth}
              />
            } 
          />
          <Route 
            path="/pinterest-callback" 
            element={
              <PinterestCallback 
                onPinterestAuth={handlePinterestAuth}
              />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
