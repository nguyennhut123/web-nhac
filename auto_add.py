import requests
import json
import subprocess
import uuid
import time
import os

def extract_id_from_link(link):
    """Trích xuất ID từ link archive.org hoặc trả về nguyên ID nếu người dùng nhập ID"""
    link = link.strip()
    if not link:
        return None
    if "archive.org/details/" in link:
        return link.split("/details/")[1].split("/")[0].split("?")[0].strip()
    return link

def fetch_album_data(identifier):
    """Gọi API của Archive để lấy metadata và danh sách bài hát"""
    url = f"https://archive.org/metadata/{identifier}"
    try:
        res = requests.get(url, timeout=10).json()
    except Exception as e:
        print(f"⚠️  Lỗi kết nối khi tải {identifier}: {e}")
        return None

    metadata = res.get("metadata", {})
    files = res.get("files", [])
    
    if not metadata:
        print(f"❌  Bỏ qua {identifier}: Không tìm thấy thông tin album.")
        return None
        
    album_title = metadata.get("title", f"Album {identifier}")
    if isinstance(album_title, list): album_title = album_title[0]
        
    artist_name = metadata.get("creator", "Unknown Artist")
    if isinstance(artist_name, list): artist_name = artist_name[0]
    
    # Tìm ảnh bìa
    cover_url = "https://via.placeholder.com/150"
    for f in files:
        if f["name"].lower().endswith((".jpg", ".png", ".jpeg")):
            cover_url = f"https://archive.org/download/{identifier}/{f['name']}"
            break
            
    # Tìm file nhạc
    songs = []
    for f in files:
        if f["name"].lower().endswith((".flac", ".mp3")):
            song_title = f.get("title", f["name"].replace(".flac", "").replace(".mp3", ""))
            song_url = f"https://archive.org/download/{identifier}/{f['name']}"
            songs.append({
                "id": str(uuid.uuid4())[:8],
                "title": song_title,
                "url": song_url,
                "cover": cover_url,
                "artist": artist_name,
                "artistName": artist_name
            })
            
    if not songs:
        print(f"❌  Bỏ qua {identifier}: Không tìm thấy file FLAC hay MP3 nào.")
        return None
        
    return {
        "artist_name": artist_name,
        "album_title": album_title,
        "songs": songs
    }

def process_batch():
    print("="*60)
    print("🚀 TOOL BẮN NHẠC HÀNG LOẠT TỪ ARCHIVE.ORG 🚀")
    print("="*60)
    print("👉 Hướng dẫn: Dán danh sách các link (hoặc ID) vào đây.")
    print("👉 Khi dán xong, ấn Enter, rồi gõ chữ 'XONG' và ấn Enter để bắt đầu bắn.\n")
    
    inputs = []
    while True:
        line = input()
        if line.strip().upper() == 'XONG':
            break
        if line.strip():
            inputs.append(line)
            
    if not inputs:
        print("Cảnh báo: Bạn chưa nhập gì cả!")
        return

    # Mở sổ xố ra chuẩn bị ghi
db_path = "public/database.json"
    if os.path.exists(db_path):
        with open(db_path, "r", encoding="utf-8") as f:
            try:
                db = json.load(f)
            except:
                db = []
    else:
        db = []

    success_count = 0
    
    # Duyệt qua từng link
    for raw_link in inputs:
        identifier = extract_id_from_link(raw_link)
        if not identifier:
            continue
            
        print(f"\n⏳ Đang xử lý: {identifier}...")
        album_data = fetch_album_data(identifier)
        
        if not album_data:
            continue
            
        new_album = {
            "id": str(uuid.uuid4())[:8],
            "title": album_data["album_title"],
            "songs": album_data["songs"]
        }
        
        artist_name = album_data["artist_name"]
        artist_found = False
        
        for artist in db:
            if artist.get("name") == artist_name:
                artist["albums"].append(new_album)
                artist_found = True
                break
                
        if not artist_found:
            db.append({
                "id": str(uuid.uuid4())[:8],
                "name": artist_name,
                "albums": [new_album]
            })
            
        print(f"✅  Xong! Thêm {len(album_data['songs'])} bài vào [{artist_name} - {album_data['album_title']}].")
        success_count += 1
        time.sleep(1) # Nghỉ 1 giây để tránh Archive.org chặn IP vì request quá nhanh

    if success_count == 0:
        print("\n⚠️ Không có album nào được thêm thành công.")
        return

    # Lưu lại file
    with open(db_path, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)
        
    print("="*60)
    print(f"🎉 TỔNG KẾT: Đã gộp thành công {success_count} album vào sổ xố database.json!")
    
    # Tự động đẩy lên mạng
    print("\n🚀 Đang tự động phóng lên máy chủ Render...")
    try:
        subprocess.run(["git", "add", "database.json"], check=True)
        subprocess.run(["git", "commit", "-m", f"Ban hang loat {success_count} album tu Archive"], check=True)
        subprocess.run(["git", "push"], check=True)
        print("\n🏆 ĐẠI THÀNH CÔNG! Pha ly cafe, đợi 2 phút ra trang Web ấn F5 là thấy thành quả!")
    except Exception as e:
        print(f"\n⚠️ File dữ liệu đã tạo xong trên máy, nhưng đẩy lên mạng bị lỗi: {e}")
        print("Hãy tự mở Terminal và gõ: git add . -> git commit -m 'update' -> git push")

if __name__ == "__main__":
    process_batch()