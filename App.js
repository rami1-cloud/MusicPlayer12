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
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerModalVisible, setTimerModalVisible] = useState(false);

  // 1. طلب الصلاحيات وجلب الملفات الصوتية
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const media = await MediaLibrary.getAssetsAsync({
          mediaType: 'audio',
        });
        setSongs(media.assets);
      }
    })();
  }, []);

  // 2. العداد التنازلي لمؤقت النوم
  useEffect(() => {
    let interval = null;
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      pauseAudio();
      setTimeLeft(null);
    }
    return () => clearInterval(interval);
  }, [timeLeft]);

  // 3. تشغيل أو إيقاف الصوت
  const playSound = async (song) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.uri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setCurrentSong(song);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  const pauseAudio = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const resumeAudio = async () => {
    if (sound) {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  // 4. ضبط المؤقت بالدقائق
  const setSleepTimer = (minutes) => {
    setTimeLeft(minutes * 60);
    setTimerModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* شريط العنوان العلوي */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>مكتبتي الموسيقية</Text>
        <TouchableOpacity
          style={styles.timerButton}
          onPress={() => setTimerModalVisible(true)}
        >
          <Text style={styles.timerButtonText}>
            {timeLeft ? `⏱️ ${Math.floor(timeLeft / 60)}m` : '⏱️ المؤقت'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* قائمة الأغاني */}
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
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

      {/* المشغل السفلي العائم (Floating Player) */}
      {currentSong && (
        <View style={styles.miniPlayer}>
          <Text style={styles.miniPlayerTitle} numberOfLines={1}>
            {currentSong.filename}
          </Text>
          <TouchableOpacity
            style={styles.playButton}
            onPress={isPlaying ? pauseAudio : resumeAudio}
          >
            <Text style={styles.playButtonText}>
              {isPlaying ? '⏸️ إيقاف' : '▶️ تشغيل'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* نافذة اختيار مؤقت النوم */}
      <Modal visible={timerModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>تحديد مؤقت النوم</Text>
            {[15, 30, 45, 60].map((mins) => (
              <TouchableOpacity
                key={mins}
                style={styles.modalOption}
                onPress={() => setSleepTimer(mins)}
              >
                <Text style={styles.modalOptionText}>{mins} دقيقة</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.modalOption, styles.cancelOption]}
              onPress={() => setTimerModalVisible(false)}
            >
              <Text style={styles.cancelOptionText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  timerButton: { backgroundColor: '#282828', padding: 8, borderRadius: 20 },
  timerButtonText: { color: '#1DB954', fontWeight: 'bold' },
  songCard: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 8,
  },
  activeSongCard: { borderColor: '#1DB954', borderWidth: 1 },
  songTitle: { color: '#FFF', fontSize: 14 },
  miniPlayer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#282828',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniPlayerTitle: { color: '#FFF', flex: 1, marginRight: 10 },
  playButton: { backgroundColor: '#1DB954', padding: 10, borderRadius: 8 },
  playButtonText: { color: '#FFF', fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#282828',
    width: '80%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalOption: { paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#444' },
  modalOptionText: { color: '#FFF', textAlign: 'center', fontSize: 16 },
  cancelOption: { borderBottomWidth: 0, marginTop: 10 },
  cancelOptionText: { color: '#FF5555', textAlign: 'center', fontWeight: 'bold' },
});
              
