import React from 'react';
import { AudioProvider } from './AudioContext';
import MusicBrowser from './MusicBrowser';
import Player from './Player';

function App() {
  return (
    <AudioProvider>
      <div className="App" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
        <MusicBrowser />
        <Player />
      </div>
    </AudioProvider>
  );
}

export default App;