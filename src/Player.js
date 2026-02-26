import React, { useContext, useState } from 'react';
import { AudioContext } from './AudioContext';
// Thêm icon Đồng hồ và dấu X
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, Heart, Clock, X } from 'lucide-react';

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

const Player = () => {
  const { 
    currentTrack, isPlaying, togglePlay, changeVolume, volume, currentTime, duration, 
    seekSong, playNext, playPrevious, isDarkMode, toggleFavorite, isFavorite,
    isShuffle, toggleShuffle, repeatMode, toggleRepeat,
    sleepSeconds, stopAfterAlbum, setTimer
  } = useContext(AudioContext);

  const [showTimerMenu, setShowTimerMenu] = useState(false);

  if (!currentTrack) return null;

  const currentPercentage = duration ? (currentTime / duration) * 100 : 0;
  const trackStyling = `linear-gradient(to right, #ff5500 ${currentPercentage}%, #4f4f4f ${currentPercentage}%)`;

  const theme = isDarkMode
    ? { bg: '#181818', text: '#fff', subText: '#b3b3b3', border: '#282828', active: '#ff5500' }
    : { bg: '#ffffff', text: '#000', subText: '#666666', border: '#e0e0e0', active: '#ff5500' };

  return (
    <>
      {/* TÍNH NĂNG MỚI: CSS RESPONSIVE CHO MOBILE BẰNG STYLE NỘI TUYẾN */}
      <style>{`
        .player-wrap { position: fixed; bottom: 0; left: 0; right: 0; height: 85px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; z-index: 1000; background-color: ${theme.bg}; border-top: 1px solid ${theme.border}; color: ${theme.text}; }
        .player-left { display: flex; align-items: center; gap: 20px; flex: 1; }
        .player-center { display: flex; align-items: center; gap: 15px; flex: 2; padding: 0 30px; }
        .player-right { display: flex; align-items: center; justify-content: flex-end; flex: 1.5; gap: 15px; position: relative; }
        .icon-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; outline: none; }
        .play-btn { width: 42px; height: 42px; border-radius: 50%; background-color: ${theme.text === '#fff' ? '#fff' : '#000'}; border: none; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: transform 0.2s; outline: none; }
        .track-details { display: flex; align-items: center; gap: 12px; padding-left: 20px; margin-left: 10px; border-left: 1px solid ${theme.border}; }
        .track-text { display: flex; flex-direction: column; }
        .track-title { margin: 0; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; font-weight: bold; color: ${theme.text}; }
        
        /* GIAO DIỆN MOBILE TỰ ĐỘNG XẾP CHỒNG (STACKING) */
        @media (max-width: 768px) {
          .player-wrap { flex-direction: column; height: auto; padding: 10px 15px 20px 15px; border-top-left-radius: 20px; border-top-right-radius: 20px; box-shadow: 0 -5px 20px rgba(0,0,0,0.3); }
          .player-right { width: 100%; justify-content: space-between; padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid ${theme.border}; flex: unset; }
          .vol-control { display: none; }
          .track-details { flex: 1; padding: 0; margin: 0; border: none; justify-content: space-between; width: 100%; }
          .track-title { max-width: 250px; }
          .player-center { width: 100%; padding: 0; margin-bottom: 10px; flex: unset; }
          .player-left { width: 100%; justify-content: space-around; flex: unset; }
          .play-btn { transform: scale(1.1); }
        }
      `}</style>

      <div className="player-wrap">
        <div className="player-left">
          <button onClick={toggleShuffle} className="icon-btn" style={{color: isShuffle ? theme.active : theme.subText}}>
              <Shuffle size={20} />
          </button>
          <button onClick={playPrevious} className="icon-btn" style={{color: theme.subText}}><SkipBack size={24} /></button>
          <button onClick={togglePlay} className="play-btn">
            {isPlaying ? <Pause size={24} fill={theme.bg} color={theme.bg} /> : <Play size={24} fill={theme.bg} color={theme.bg} style={{marginLeft: '4px'}} />}
          </button>
          <button onClick={playNext} className="icon-btn" style={{color: theme.subText}}><SkipForward size={24} /></button>
          <button onClick={toggleRepeat} className="icon-btn" style={{color: repeatMode !== 0 ? theme.active : theme.subText}}>
              {repeatMode === 2 ? <Repeat1 size={20} /> : <Repeat size={20} />}
          </button>
        </div>
        
        <div className="player-center">
          <span style={{fontSize: '12px', minWidth: '40px', color: theme.subText}}>{formatTime(currentTime)}</span>
          <input type="range" min="0" max={duration || 0} value={currentTime} onChange={(e) => seekSong(Number(e.target.value))} style={{ width: '100%', background: trackStyling }} />
          <span style={{fontSize: '12px', minWidth: '40px', textAlign: 'right', color: theme.subText}}>{formatTime(duration)}</span>
        </div>

        <div className="player-right">
          <Volume2 size={20} color={theme.subText} className="vol-control" />
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => changeVolume(e.target.value)} className="vol-control" style={{ width: '80px', background: `linear-gradient(to right, #ff5500 ${volume * 100}%, #4f4f4f ${volume * 100}%)` }} />
          
          <div className="track-details">
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <img src={currentTrack.cover} alt="cover" style={{width:'45px', height:'45px', borderRadius:'6px'}} />
                <div className="track-text">
                    <h4 className="track-title">{currentTrack.title}</h4>
                    <p style={{margin:0, fontSize:'12px', color:theme.subText}}>{currentTrack.artist}</p>
                </div>
              </div>
              
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <button onClick={() => toggleFavorite(currentTrack)} className="icon-btn">
                  <Heart size={20} fill={isFavorite(currentTrack.id) ? '#ff5500' : 'transparent'} color={isFavorite(currentTrack.id) ? '#ff5500' : theme.subText} />
                </button>

                {/* NÚT HẸN GIỜ */}
                <button onClick={() => setShowTimerMenu(!showTimerMenu)} className="icon-btn" style={{color: (sleepSeconds > 0 || stopAfterAlbum) ? theme.active : theme.subText, position:'relative'}}>
                  <Clock size={20} />
                  {sleepSeconds > 0 && <span style={{position:'absolute', top:'-8px', right:'-15px', fontSize:'10px', fontWeight:'bold', color:theme.active}}>{formatTime(sleepSeconds)}</span>}
                  {stopAfterAlbum && <span style={{position:'absolute', top:'-8px', right:'-15px', fontSize:'10px', fontWeight:'bold', color:theme.active}}>1x</span>}
                </button>
              </div>
          </div>

          {/* MENU HẸN GIỜ TẮT */}
          {showTimerMenu && (
            <div style={{ position: 'absolute', bottom: '70px', right: '0', background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '10px', width: '160px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', zIndex: 1001 }}>
                <div style={{ display:'flex', justifyContent:'space-between', borderBottom:`1px solid ${theme.border}`, paddingBottom:'5px', marginBottom:'5px', fontSize:'13px', fontWeight:'bold', color: theme.text }}>
                  Hẹn giờ tắt <X size={15} style={{cursor:'pointer'}} onClick={()=>setShowTimerMenu(false)}/>
                </div>
                {[
                    { label: 'Tắt hẹn giờ', val: 0 },
                    { label: '15 Phút', val: 15 },
                    { label: '30 Phút', val: 30 },
                    { label: '60 Phút', val: 60 },
                    { label: 'Hết Album', val: -1 },
                ].map(opt => (
                    <div key={opt.val} onClick={() => { setTimer(opt.val); setShowTimerMenu(false); }} 
                         style={{ padding: '8px', fontSize: '13px', cursor: 'pointer', color: theme.text, borderRadius: '5px' }} 
                         onMouseEnter={e => e.target.style.background = theme.active + '30'} 
                         onMouseLeave={e => e.target.style.background = 'transparent'}>
                        {opt.label}
                    </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Player;