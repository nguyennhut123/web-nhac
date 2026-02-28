import React, { createContext, useState, useRef, useEffect } from 'react';

export const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentPlaylist, setCurrentPlaylist] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); 

  // === HẸN GIỜ TẮT NHẠC (SLEEP TIMER) ===
  const [sleepSeconds, setSleepSeconds] = useState(0);
  const [stopAfterAlbum, setStopAfterAlbum] = useState(false);

  const setTimer = (minutes) => {
    if (minutes === 0) { setSleepSeconds(0); setStopAfterAlbum(false); } 
    else if (minutes === -1) { setSleepSeconds(0); setStopAfterAlbum(true); } 
    else { setSleepSeconds(minutes * 60); setStopAfterAlbum(false); }
  };

  useEffect(() => {
    let interval = null;
    if (sleepSeconds > 0) {
      interval = setInterval(() => {
        setSleepSeconds(prev => {
          if (prev <= 1) {
            audioRef.current.pause();
            setIsPlaying(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sleepSeconds]);

  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('music_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('music_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (song) => {
    setFavorites(prev => {
      if (prev.some(s => s.id === song.id)) return prev.filter(s => s.id !== song.id);
      return [...prev, song];
    });
  };

  const isFavorite = (songId) => favorites.some(s => s.id === songId);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const audioRef = useRef(new Audio());

// === XỬ LÝ PHÁT NHẠC TRỰC TIẾP ===
  useEffect(() => {
    if (currentTrack) {
      let finalUrl = currentTrack.url.split('#')[0];
      audioRef.current.src = finalUrl;
      setCurrentTime(0);
      audioRef.current.play().then(() => setIsPlaying(true)).catch(err => console.log("Lỗi:", err));
    }
  }, [currentTrack]);

  useEffect(() => {
    isPlaying ? audioRef.current.play() : audioRef.current.pause();
  }, [isPlaying]);

  const playNext = () => {
    if (currentPlaylist.length > 0 && currentTrack) {
      if (isShuffle) {
        let randomIndex = Math.floor(Math.random() * currentPlaylist.length);
        while (currentPlaylist.length > 1 && currentPlaylist[randomIndex].id === currentTrack.id) {
          randomIndex = Math.floor(Math.random() * currentPlaylist.length);
        }
        setCurrentTrack({ ...currentPlaylist[randomIndex], artist: currentTrack.artist });
      } else {
        const currentIndex = currentPlaylist.findIndex(song => song.id === currentTrack.id);
        if (currentIndex !== -1) {
          if (currentIndex < currentPlaylist.length - 1) {
            setCurrentTrack({ ...currentPlaylist[currentIndex + 1], artist: currentTrack.artist });
          } else if (repeatMode === 1) {
            setCurrentTrack({ ...currentPlaylist[0], artist: currentTrack.artist });
          } else {
            setIsPlaying(false); 
          }
        }
      }
    }
  };

  const playPrevious = () => {
    if (currentPlaylist.length > 0 && currentTrack) {
      const currentIndex = currentPlaylist.findIndex(song => song.id === currentTrack.id);
      if (currentIndex > 0) {
        setCurrentTrack({ ...currentPlaylist[currentIndex - 1], artist: currentTrack.artist });
      } else if (repeatMode === 1) {
        setCurrentTrack({ ...currentPlaylist[currentPlaylist.length - 1], artist: currentTrack.artist });
      }
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    const updateTime = () => setCurrentTime(audio.currentTime);
    const setAudioData = () => setDuration(audio.duration);
    
    const handleEnded = () => {
      if (repeatMode === 2) {
        audio.currentTime = 0; audio.play();
      } else {
        const currentIndex = currentPlaylist.findIndex(song => song.id === currentTrack.id);
        if (stopAfterAlbum && currentIndex === currentPlaylist.length - 1) {
            setIsPlaying(false);
            setStopAfterAlbum(false);
            return; 
        }
        playNext();
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack, currentPlaylist, isShuffle, repeatMode, stopAfterAlbum]); 

  // === CÁC HÀM ĐIỀU KHIỂN ===
  const playTrack = (track, playlist = []) => {
    setCurrentTrack(track);
    if (playlist.length > 0) setCurrentPlaylist(playlist);
    setIsPlaying(true);
  };

  const togglePlay = () => setIsPlaying(prev => !prev);
  const toggleShuffle = () => setIsShuffle(!isShuffle);
  const toggleRepeat = () => setRepeatMode((prev) => (prev + 1) % 3);

  const changeVolume = (val) => { 
    const v = Math.min(Math.max(val, 0), 1);
    setVolume(v); 
    audioRef.current.volume = v; 
  };
  const seekSong = (time) => { audioRef.current.currentTime = time; setCurrentTime(time); }

  // === LẮNG NGHE PHÍM TẮT ===
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.code) {
        case 'Space': e.preventDefault(); togglePlay(); break;
        case 'ArrowRight': e.preventDefault(); playNext(); break;
        case 'ArrowLeft': e.preventDefault(); playPrevious(); break;
        case 'ArrowUp': e.preventDefault(); changeVolume(volume + 0.1); break;
        case 'ArrowDown': e.preventDefault(); changeVolume(volume - 0.1); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, currentPlaylist, isShuffle, repeatMode, volume]); 

  return (
    <AudioContext.Provider value={{
      currentTrack, isPlaying, volume, currentTime, duration, isDarkMode, 
      favorites, toggleFavorite, isFavorite,
      isShuffle, toggleShuffle, repeatMode, toggleRepeat,
      sleepSeconds, stopAfterAlbum, setTimer,
      playTrack, togglePlay, changeVolume, seekSong, playNext, playPrevious, toggleTheme
    }}>
      {children}
    </AudioContext.Provider>
  );
};