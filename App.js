import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';

export default function App() {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullPlayerVisible, setFullPlayerVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          const media = await MediaLibrary.getAssetsAsync({ mediaType: 'audio' });
          setSongs(media.assets);
        }
      } catch (e) {
        console.log(e);
      }
    })();
  }, []);

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis || 0);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    }
  };

  const playSound = async (song) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.uri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setCurrentSong(song);
      setIsPlaying(true);
      setFullPlayerVisible(true);
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  const togglePlayPause = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const formatTime = (millis) => {
    if (!millis) return '00:00';
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* الهيدر العلوي */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>مكتبتي الموسيقية</Text>
      </View>

      {/* قائمة الأغاني */}
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.songCard,
              currentSong?.id === item.id && styles.activeSongCard,
            ]}
            onPress={() => playSound(item)}
          >
            <Text style={styles.songTitle} numberOfLines={1}>
              {item.filename}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* الشريط السفلي */}
      {currentSong && (
        <TouchableOpacity
          style={styles.miniPlayer}
          onPress={() => setFullPlayerVisible(true)}
        >
          <Text style={styles.miniPlayerTitle} numberOfLines={1}>
            {currentSong.filename}
          </Text>
          <TouchableOpacity onPress={togglePlayPause} style={styles.miniPlayBtn}>
            <Text style={styles.miniPlayBtnText}>{isPlaying ? '⏸️' : '▶️'}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* الشاشة الكاملة للمشغل */}
      <Modal visible={fullPlayerVisible} animationType="slide">
        <View style={styles.fullPlayerContainer}>
          {/* شريط الإغلاق العلوي */}
          <View style={styles.fullHeader}>
            <TouchableOpacity onPress={() => setFullPlayerVisible(false)}>
              <Text style={styles.closeIcon}>∨</Text>
            </TouchableOpacity>
            <View style={styles.tabs}>
              <Text style={[styles.tabText, styles.activeTabText]}>الغلاف</Text>
              <Text style={styles.tabText}>كلمات الأغاني</Text>
            </View>
            <Text style={styles.menuIcon}>⋮</Text>
          </View>

          {/* صورة القرص / الغلاف */}
          <View style={styles.coverWrapper}>
            <View style={styles.coverBox}>
              <View style={styles.vinylRecord}>
                <View style={styles.vinylCenter} />
              </View>
            </View>
          </View>

          {/* تفاصيل الأغنية */}
          <View style={styles.songDetails}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fullSongTitle} numberOfLines={1}>
                {currentSong?.filename}
              </Text>
              <Text style={styles.artistName}>ملف صوتي</Text>
            </View>
            <TouchableOpacity style={{ marginLeft: 15 }}>
              <Text style={styles.actionIcon}>♡</Text>
            </TouchableOpacity>
          </View>

          {/* شريط التقدم المخصص */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          {/* أزرار التحكم */}
          <View style={styles.controlsRow}>
            <TouchableOpacity><Text style={styles.controlBtn}>🔁</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.controlBtn}>⏮</Text></TouchableOpacity>
            <TouchableOpacity style={styles.mainPlayBtn} onPress={togglePlayPause}>
              <Text style={styles.mainPlayBtnText}>{isPlaying ? '⏸' : '▶'}</Text>
            </TouchableOpacity>
            <TouchableOpacity><Text style={styles.controlBtn}>⏭</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.controlBtn}>≡</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { padding: 20, alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  songCard: { backgroundColor: '#1E1E1E', padding: 16, marginHorizontal: 16, marginVertical: 6, borderRadius: 8 },
  activeSongCard: { borderColor: '#1DB954', borderWidth: 1 },
  songTitle: { color: '#FFF', fontSize: 14 },
  miniPlayer: { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: '#282828', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  miniPlayerTitle: { color: '#FFF', flex: 1 },
  miniPlayBtn: { padding: 5 },
  miniPlayBtnText: { fontSize: 20 },
  
  fullPlayerContainer: { flex: 1, backgroundColor: '#3A2B33', padding: 20, justifyContent: 'space-between' },
  fullHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  closeIcon: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  menuIcon: { color: '#FFF', fontSize: 24 },
  tabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 4 },
  tabText: { color: 'rgba(255,255,255,0.6)', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15, fontSize: 12 },
  activeTabText: { backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFF' },
  
  coverWrapper: { alignItems: 'center', marginVertical: 20 },
  coverBox: { width: 260, height: 260, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  vinylRecord: { width: 190, height: 190, borderRadius: 95, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  vinylCenter: { width: 65, height: 65, borderRadius: 33, backgroundColor: '#E53935' },
  
  songDetails: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  fullSongTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  artistName: { color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  actionIcon: { color: '#FFF', fontSize: 24 },
  
  progressContainer: { marginVertical: 10 },
  progressBarBackground: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#FFF' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  timeText: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  
  controlsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 20 },
  controlBtn: { color: '#FFF', fontSize: 22 },
  mainPlayBtn: { width: 65, height: 65, borderRadius: 35, borderColor: '#FFF', borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  mainPlayBtnText: { color: '#FFF', fontSize: 26 },
});
    
