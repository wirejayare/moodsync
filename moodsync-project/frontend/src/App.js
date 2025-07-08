import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import SpotifyCallback from './components/SpotifyCallback';
import PinterestCallback from './components/PinterestCallback';

function App() {
  const [spotifyUser, setSpotifyUser] = useState(null);
  const [spotifyToken, setSpotifyToken] = useState(null);
  const [pinterestUser, setPinterestUser] = useState(null);
  const [pinterestToken, setPinterestToken] = useState(null);

  const handleSpotifyAuth = (token, user) => {
    setSpotifyToken(token);
    setSpotifyUser(user);
    console.log('Spotify authenticated:', user.display_name);
  };

  const handlePinterestAuth = (token, user) => {
    setPinterestToken(token);
    setPinterestUser(user);
    console.log('Pinterest authenticated:', user.username);
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
