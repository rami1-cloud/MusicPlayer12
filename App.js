import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, Statusbar } from 'react-native';
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';

export default function App() {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    configureAudioAndFetch();
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, []);

  // إعداد الصوت للعمل في الخلفية وطلب الصلاحيات
  const configureAudioAndFetch = async () => {
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true, // التشغيل في الخلفية
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') {
      const media = await MediaLibrary.getAssetsAsync({ mediaType: 'audio' });
      setSongs(media.assets);
    }
  };

  // تشغيل أو إيقاف الصوت
  const playSound = async (item) => {
    if (sound) await sound.unloadAsync();
    
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: item.uri },
      { shouldPlay: true }
    );
    
    setSound(newSound);
    setCurrentSong(item);
    setIsPlaying(true);
  };

  const togglePlayPause = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>مكتبتي الموسيقية</Text>
      
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.songCard} onPress={() => playSound(item)}>
            <Text style={styles.songTitle} numberOfLines={1}>{item.filename}</Text>
          </TouchableOpacity>
        )}
      />

      {/* شريط التشغيل السفلي */}
      {currentSong && (
        <View style={styles.playerBar}>
          <Text style={styles.playerTitle} numberOfLines={1}>{currentSong.filename}</Text>
          <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
            <Text style={styles.playBtnText}>{isPlaying ? "⏸ إيقاف" : "▶ تشغيل"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingTop: 40 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 15 },
  songCard: { backgroundColor: '#1e1e1e', padding: 15, marginHorizontal: 15, marginVertical: 5, borderRadius: 10 },
  songTitle: { color: '#fff', fontSize: 14 },
  playerBar: { backgroundColor: '#282828', padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#333' },
  playerTitle: { color: '#fff', fontSize: 13, flex: 1, marginRight: 10 },
  playButton: { backgroundColor: '#1db954', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  playBtnText: { color: '#fff', fontWeight: 'bold' }
});
       
