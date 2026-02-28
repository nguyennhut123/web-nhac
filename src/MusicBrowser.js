import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AudioContext } from './AudioContext';
import { Search, User, Disc, Music, Sun, Moon, AudioLines, Heart, LocateFixed, ChevronLeft } from 'lucide-react';

const normalizeString = (str) => {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').toLowerCase().trim();
};

const MusicBrowser = () => {
  const { playTrack, currentTrack, isPlaying, isDarkMode, toggleTheme, favorites, toggleFavorite, isFavorite } = useContext(AudioContext);
  const [musicData, setMusicData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Trạng thái điều hướng cho Mobile
  const [viewStep, setViewStep] = useState('artists'); // 'artists', 'albums', 'songs'

  useEffect(() => {
fetch('/database.json')
      .then(res => res.json())
      .then(data => { setMusicData(data); setLoading(false); })
      .catch(err => console.error("Lỗi:", err));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchTerm); }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const allSongs = useMemo(() => {
    return musicData.flatMap(artist =>
      artist.albums.flatMap(album =>
        album.songs.map(song => ({ ...song, artistName: artist.name, albumTitle: album.title, searchKey: normalizeString(song.title + " " + artist.name) }))
      )
    );
  }, [musicData]);
  
  const searchResults = useMemo(() => {
      if(!debouncedSearch) return [];
      const query = normalizeString(debouncedSearch);
      return allSongs.filter(song => song.searchKey.includes(query));
  }, [debouncedSearch, allSongs]);

  const favoriteArtistMock = {
    id: 'fav_artist', name: '💖 Playlist Của Tôi',
    albums: [{ id: 'fav_album', title: 'Danh sách Yêu thích', songs: favorites }]
  };
  const displayArtists = [favoriteArtistMock, ...musicData];

  const theme = isDarkMode ? {
    bg: '#121212', text: '#ffffff', headerBg: '#0a0a0a', border: '#282828',
    itemHover: '#2a2a2a', colHeader: '#181818', textMuted: '#b3b3b3', inputBg: '#242424', active: '#ff5500'
  } : {
    bg: '#f8f9fa', text: '#202124', headerBg: '#ffffff', border: '#e0e0e0',
    itemHover: '#e8eaed', colHeader: '#f1f3f4', textMuted: '#5f6368', inputBg: '#e8eaed', active: '#ff5500'
  };

  const handleArtistClick = (artist) => {
    setSelectedArtist(artist);
    setSelectedAlbum(null); // Không chọn mặc định album đầu tiên nữa
    setViewStep('albums'); // Chuyển sang xem album trên mobile
  };

  const handleAlbumClick = (album) => {
    setSelectedAlbum(album);
    setViewStep('songs'); // Chuyển sang xem bài hát trên mobile
  };

  const handleBack = () => {
    if (viewStep === 'songs') setViewStep('albums');
    else if (viewStep === 'albums') setViewStep('artists');
  };

  if (loading) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff5500', backgroundColor: theme.bg}}>Đang kết nối kho nhạc...</div>;

  return (
    <>
      <style>{`
        .app-wrapper { display: flex; flex-direction: column; height: calc(100vh - 85px); background-color: ${theme.bg}; color: ${theme.text}; overflow: hidden; }
        .header-bar { padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; background-color: ${theme.headerBg}; border-bottom: 1px solid ${theme.border}; }
        .search-box { display: flex; align-items: center; padding: 10px 20px; border-radius: 30px; width: 40%; gap: 10px; background-color: ${theme.inputBg}; }
        .main-cols { display: flex; flex: 1; overflow: hidden; }
        .col-artist, .col-album, .col-song { overflow-y: auto; transition: all 0.3s; }
        .col-artist { flex: 1; border-right: 1px solid ${theme.border}; }
        .col-album { flex: 1.2; border-right: 1px solid ${theme.border}; }
        .col-song { flex: 2.5; }
        .col-head { position: sticky; top: 0; padding: 12px 20px; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; display: flex; align-items: center; gap: 8px; z-index: 10; text-transform: uppercase; background-color: ${theme.colHeader}; border-bottom: 1px solid ${theme.border}; color: ${theme.textMuted}; }
        .list-item { padding: 12px 20px; font-size: 13px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .song-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; cursor: pointer; border-bottom: 1px solid ${theme.border}; }
        
        @media (max-width: 768px) {
          .header-bar { padding: 10px; flex-direction: column; gap: 10px; }
          .search-box { width: 100%; }
          .col-artist, .col-album, .col-song { flex: 1; border-right: none; display: none; }
          .show-step { display: block !important; }
          .back-btn { display: flex !important; align-items: center; gap: 5px; cursor: pointer; color: ${theme.active}; font-weight: bold; margin-bottom: 10px; }
          .app-wrapper { height: 100vh; padding-bottom: 150px; }
        }
      `}</style>

      <div className="app-wrapper">
        <div className="header-bar">
          <div className="search-box">
            <Search size={18} color={theme.textMuted} />
            <input type="text" placeholder="Tìm kiếm..." value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); if(e.target.value) setViewStep('songs')}} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: theme.text }} />
          </div>
          <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
             <button onClick={toggleTheme} style={{ border: 'none', width: '35px', height: '35px', borderRadius: '50%', backgroundColor: theme.inputBg, color: theme.text }}>
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
             </button>
          </div>
        </div>

        <div className="main-cols">
          {/* CỘT CA SĨ */}
          <div className={`col-artist ${viewStep === 'artists' ? 'show-step' : ''}`}>
            <div className="col-head"><User size={14}/> THƯ VIỆN</div>
            {displayArtists.map((artist) => (
              <div key={artist.id} onClick={() => handleArtistClick(artist)} className="list-item" style={{ color: selectedArtist?.id === artist.id ? theme.active : theme.text }}>
                {artist.name}
              </div>
            ))}
          </div>

          {/* CỘT ALBUM */}
          <div className={`col-album ${viewStep === 'albums' ? 'show-step' : ''}`}>
            <div className="col-head" onClick={handleBack}>
               <ChevronLeft size={16} className="back-btn" style={{display:'none'}}/>
               <Disc size={14}/> ALBUM {selectedArtist ? `- ${selectedArtist.name}` : ''}
            </div>
            {selectedArtist?.albums.map(album => (
              <div key={album.id} onClick={() => handleAlbumClick(album)} className="list-item" style={{ color: selectedAlbum?.id === album.id ? theme.active : theme.text }}>
                {album.title}
              </div>
            ))}
          </div>

          {/* CỘT BÀI HÁT */}
          <div className={`col-song ${viewStep === 'songs' ? 'show-step' : ''}`}>
            <div className="col-head" onClick={handleBack}>
               <ChevronLeft size={16} className="back-btn" style={{display:'none'}}/>
               <Music size={14}/> {debouncedSearch ? 'KẾT QUẢ' : 'BÀI HÁT'}
            </div>
            {(debouncedSearch ? searchResults : selectedAlbum?.songs || []).map((song, index) => (
              <div key={song.id} onClick={() => playTrack(song, debouncedSearch ? searchResults : selectedAlbum.songs)} className="song-item">
                <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                  <Heart size={16} fill={isFavorite(song.id) ? theme.active : 'transparent'} color={isFavorite(song.id) ? theme.active : theme.textMuted} onClick={(e) => {e.stopPropagation(); toggleFavorite(song)}}/>
                  <div style={{display:'flex', flexDirection:'column'}}>
                    <span style={{color: currentTrack?.id === song.id ? theme.active : theme.text, fontSize:'14px'}}>{song.title}</span>
                    <span style={{fontSize:'11px', color:theme.textMuted}}>{song.artistName || selectedArtist?.name}</span>
                  </div>
                </div>
                {currentTrack?.id === song.id && isPlaying && <AudioLines size={16} color={theme.active}/>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default MusicBrowser;