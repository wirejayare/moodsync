// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import SpotifyCallback from './components/SpotifyCallback';

function App() {
  const [spotifyUser, setSpotifyUser] = useState(null);
  const [spotifyToken, setSpotifyToken] = useState(null);

  const handleSpotifyAuth = (token, user) => {
    setSpotifyToken(token);
    setSpotifyUser(user);
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
        </Routes>
      </div>
    </Router>
  );
}

export default App;
