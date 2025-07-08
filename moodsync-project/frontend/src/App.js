import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import SpotifyCallback from './components/SpotifyCallback';
import PinterestCallback from './components/PinterestCallback';

function App() {
  const [spotifyUser, setSpotifyUser] = useState(null);
  const [spotifyToken, setSpotifyToken] = useState(null);
  const [pinterestUser, setPinterestUser] = useState(null);
  const [pinterestToken, setPinterestToken] = useState(null);

  // Load saved authentication state on app start
  useEffect(() => {
    const savedSpotifyUser = localStorage.getItem('moodsync_spotify_user');
    const savedSpotifyToken = localStorage.getItem('moodsync_spotify_token');
    const savedPinterestUser = localStorage.getItem('moodsync_pinterest_user');
    const savedPinterestToken = localStorage.getItem('moodsync_pinterest_token');

    if (savedSpotifyUser && savedSpotifyToken) {
      try {
        setSpotifyUser(JSON.parse(savedSpotifyUser));
        setSpotifyToken(savedSpotifyToken);
        console.log('Restored Spotify session');
      } catch (error) {
        console.error('Error restoring Spotify session:', error);
        // Clear corrupted data
        localStorage.removeItem('moodsync_spotify_user');
        localStorage.removeItem('moodsync_spotify_token');
      }
    }

    if (savedPinterestUser && savedPinterestToken) {
      try {
        setPinterestUser(JSON.parse(savedPinterestUser));
        setPinterestToken(savedPinterestToken);
        console.log('Restored Pinterest session');
      } catch (error) {
        console.error('Error restoring Pinterest session:', error);
        // Clear corrupted data
        localStorage.removeItem('moodsync_pinterest_user');
        localStorage.removeItem('moodsync_pinterest_token');
      }
    }
  }, []);

  const handleSpotifyAuth = (token, user) => {
    setSpotifyToken(token);
    setSpotifyUser(user);
    
    // Persist to localStorage
    localStorage.setItem('moodsync_spotify_token', token);
    localStorage.setItem('moodsync_spotify_user', JSON.stringify(user));
    
    console.log('Spotify authenticated and saved:', user.display_name);
  };

  const handlePinterestAuth = (token, user) => {
    setPinterestToken(token);
    setPinterestUser(user);
    
    // Persist to localStorage
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
