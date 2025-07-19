// app/eye-protector.tsx

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { scheduleReminders } from '../services/eyeProtectorService';

const SOUND_OPTIONS = ['default', 'beep-01a.wav', 'beep-02.wav', 'beep-03.wav', 'beep-09.wav'];

type EyeProtectorSettings = {
  isEnabled: boolean;
  startTime: string;
  endTime: string;
  eyeSound: string;
  breakSound: string;
};

const CustomSoundPicker = ({ visible, options, onSelect, onClose }: {
    visible: boolean;
    options: string[];
    onSelect: (value: string) => void;
    onClose: () => void;
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
                <View style={styles.pickerContainer}>
                    <FlatList
                        data={options}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.pickerOption} onPress={() => onSelect(item)}>
                                <Text style={styles.pickerOptionText}>{item.split('.')[0]}</Text>
                            </TouchableOpacity>
                        )}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                </View>
            </TouchableOpacity>
        </Modal>
    );
};


const formatTimeForDisplay = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function EyeProtectorScreen() {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<Date>(new Date(new Date().setHours(9, 0, 0)));
  const [endTime, setEndTime] = useState<Date>(new Date(new Date().setHours(17, 0, 0)));
  const [eyeSound, setEyeSound] = useState<string>('default');
  const [breakSound, setBreakSound] = useState<string>('default');
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);
  
  const [isSoundPickerVisible, setSoundPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'eye' | 'break' | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await AsyncStorage.getItem('@eye_protector_settings');
      if (savedSettings) {
        const settings: EyeProtectorSettings = JSON.parse(savedSettings);
        setIsEnabled(settings.isEnabled);
        const [startH, startM] = settings.startTime.split(':').map(Number);
        const [endH, endM] = settings.endTime.split(':').map(Number);
        setStartTime(new Date(new Date().setHours(startH, startM, 0)));
        setEndTime(new Date(new Date().setHours(endH, endM, 0)));
        setEyeSound(settings.eyeSound || 'default');
        setBreakSound(settings.breakSound || 'default');
      }
    };
    loadSettings();
  }, []);

  const openSoundPicker = (target: 'eye' | 'break') => {
    setPickerTarget(target);
    setSoundPickerVisible(true);
  };

  const handleSelectSound = (sound: string) => {
    if (pickerTarget === 'eye') {
        setEyeSound(sound);
    } else if (pickerTarget === 'break') {
        setBreakSound(sound);
    }
    setSoundPickerVisible(false);
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || (showPicker === 'start' ? startTime : endTime);
    setShowPicker(null);
    if (showPicker === 'start') {
        setStartTime(currentDate);
    } else if (showPicker === 'end') {
        setEndTime(currentDate);
    }
  };

  // ✅✅✅ এই ফাংশনটি আপডেট করা হয়েছে ✅✅✅
  const handleSaveSettings = useCallback(() => {
    // ধাপ ১: ব্যবহারকারীকে সাথে সাথে আগের পেজে ফিরিয়ে দেওয়া হবে
    router.back();

    // ধাপ ২: সেটিংস সেভ করা এবং নোটিফিকেশন শিডিউল করার কাজটি ব্যাকগ্রাউন্ডে হবে
    const saveAndSchedule = async () => {
        const newSettings: EyeProtectorSettings = { 
            isEnabled, 
            startTime: `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`,
            endTime: `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`,
            eyeSound,
            breakSound,
        };
        await AsyncStorage.setItem('@eye_protector_settings', JSON.stringify(newSettings));
        await scheduleReminders();
    };

    // উপরের async ফাংশনটিকে কল করা হচ্ছে, কিন্তু এর জন্য অপেক্ষা করা হচ্ছে না
    saveAndSchedule();

  }, [isEnabled, startTime, endTime, eyeSound, breakSound, router]);

  return (
    <LinearGradient colors={["#10101A", "#0A0A0A"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={32} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Eye Protector</Text>
            <View style={{width: 32}} />
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Enable Reminders</Text>
            <Switch
              value={isEnabled}
              onValueChange={setIsEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {isEnabled && (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>Set Your Active Hours</Text>
              <View style={styles.timeRow}>
                  <TouchableOpacity style={styles.timeButton} onPress={() => setShowPicker('start')}>
                      <Text style={styles.timeButtonLabel}>Start Time</Text>
                      <Text style={styles.timeButtonText}>{formatTimeForDisplay(startTime)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.timeButton} onPress={() => setShowPicker('end')}>
                      <Text style={styles.timeButtonLabel}>End Time</Text>
                      <Text style={styles.timeButtonText}>{formatTimeForDisplay(endTime)}</Text>
                  </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Eye Break Sound</Text>
              <TouchableOpacity style={styles.dropdownTrigger} onPress={() => openSoundPicker('eye')}>
                  <Text style={styles.dropdownText}>{eyeSound.split('.')[0]}</Text>
                  <Ionicons name="chevron-down" size={20} color="#8A8A8E" />
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Long Break Sound</Text>
              <TouchableOpacity style={styles.dropdownTrigger} onPress={() => openSoundPicker('break')}>
                  <Text style={styles.dropdownText}>{breakSound.split('.')[0]}</Text>
                  <Ionicons name="chevron-down" size={20} color="#8A8A8E" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {showPicker && (
        <DateTimePicker
            value={showPicker === 'start' ? startTime : endTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
        />
      )}
      
      <CustomSoundPicker 
        visible={isSoundPickerVisible}
        options={SOUND_OPTIONS}
        onSelect={handleSelectSound}
        onClose={() => setSoundPickerVisible(false)}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: Platform.OS === 'android' ? 40 : 60, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  card: { backgroundColor: 'rgba(28, 28, 30, 0.8)', borderRadius: 12, padding: 20, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 17, color: '#FFFFFF', fontWeight: '500', marginBottom: 5 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  timeButton: { backgroundColor: '#3A3A3C', borderRadius: 8, padding: 15, width: '48%', alignItems: 'center' },
  timeButtonLabel: { color: '#AEAEB2', fontSize: 14, marginBottom: 5 },
  timeButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  saveButton: { backgroundColor: '#007AFF', padding: 15, margin: 20, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  dropdownTrigger: {
    backgroundColor: '#3A3A3C',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    color: '#FFFFFF',
    fontSize: 16,
    textTransform: 'capitalize',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    width: '80%',
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    maxHeight: '60%',
  },
  pickerOption: {
    padding: 20,
    alignItems: 'center',
  },
  pickerOptionText: {
    color: '#FFFFFF',
    fontSize: 18,
    textTransform: 'capitalize',
  },
  separator: {
    height: 1,
    backgroundColor: '#3A3A3C',
  },
});