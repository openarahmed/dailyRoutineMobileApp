import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
const periods = ["AM", "PM"];

const PickerColumn = React.memo(({ data, initialValue, onValueChange }: { data: string[], initialValue: string, onValueChange: (value: string) => void }) => {
    const flatListRef = useRef<FlatList>(null);
    const paddedData = ["", ...data, ""];

    useEffect(() => {
      const initialIndex = data.indexOf(initialValue);
      if (initialIndex !== -1 && flatListRef.current) {
        setTimeout(() => flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false }), 0);
      }
    }, [initialValue, data]);

    const renderListItem = useCallback(({ item }: { item: string }) => (
      <View style={{ height: ITEM_HEIGHT, justifyContent: "center", alignItems: "center" }}>
        <Text style={styles.pickerItem}>{item}</Text>
      </View>
    ), []);

    return (
      <FlatList
        ref={flatListRef}
        data={paddedData}
        renderItem={renderListItem}
        keyExtractor={(item, index) => `${item}-${index}`}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          if (data[index]) onValueChange(data[index]);
        }}
        initialScrollIndex={initialValue ? data.indexOf(initialValue) : 0}
      />
    );
});

const CustomTimePicker = ({ isVisible, onClose, onTimeSelect, initialTime }: { isVisible: boolean, onClose: () => void, onTimeSelect: (date: Date) => void, initialTime: Date | null }) => {
  const [selectedHour, setSelectedHour] = useState("12");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedPeriod, setSelectedPeriod] = useState("AM");

  useEffect(() => {
    if (isVisible) {
      const timeToSet = initialTime || new Date();
      setSelectedHour((timeToSet.getHours() % 12 || 12).toString().padStart(2, "0"));
      setSelectedMinute(timeToSet.getMinutes().toString().padStart(2, "0"));
      setSelectedPeriod(timeToSet.getHours() >= 12 ? "PM" : "AM");
    }
  }, [isVisible, initialTime]);

  const handleSelect = () => {
    let hour24 = parseInt(selectedHour, 10);
    if (selectedPeriod === "PM" && hour24 < 12) hour24 += 12;
    if (selectedPeriod === "AM" && hour24 === 12) hour24 = 0;
    const newDate = new Date();
    newDate.setHours(hour24, parseInt(selectedMinute, 10), 0, 0);
    onTimeSelect(newDate);
    onClose();
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.pickerModalBackground}>
        <View style={styles.pickerModalContainer}>
          <Text style={styles.pickerTitle}>Select Time</Text>
          <View style={styles.pickerColumnsContainer}>
            <View style={styles.selectionIndicator} />
            <PickerColumn data={hours} initialValue={selectedHour} onValueChange={setSelectedHour} />
            <Text style={styles.pickerSeparator}>:</Text>
            <PickerColumn data={minutes} initialValue={selectedMinute} onValueChange={setSelectedMinute} />
            <PickerColumn data={periods} initialValue={selectedPeriod} onValueChange={setSelectedPeriod} />
          </View>
          <View style={styles.pickerButtons}>
            <TouchableOpacity onPress={onClose} style={[styles.pickerBtn, { backgroundColor: "#555" }]}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSelect} style={styles.pickerBtn}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
    pickerModalBackground:{flex:1,backgroundColor:"rgba(0,0,0,0.7)",justifyContent:"center",alignItems:"center"},
    pickerModalContainer:{width:"85%",backgroundColor:"#2C2C2E",borderRadius:14,padding:20},
    pickerTitle:{color:"#fff",fontSize:18,fontWeight:"bold",textAlign:"center",marginBottom:20},
    pickerColumnsContainer:{flexDirection:"row",justifyContent:"space-around",alignItems:"center",height:PICKER_HEIGHT,overflow:"hidden"},
    pickerItem:{color:"#fff",fontSize:26,fontWeight:"600",textAlign:"center"},
    pickerSeparator:{color:"#fff",fontSize:26,fontWeight:"bold",marginHorizontal:-10},
    selectionIndicator:{position:"absolute",width:"100%",height:ITEM_HEIGHT,backgroundColor:"rgba(255, 255, 255, 0.1)",borderRadius:10,top:ITEM_HEIGHT,borderTopWidth:1,borderBottomWidth:1,borderColor:"rgba(255, 255, 255, 0.2)"},
    pickerButtons:{flexDirection:"row",justifyContent:"space-between",marginTop:30},
    pickerBtn:{backgroundColor:"#007AFF",paddingHorizontal:20,paddingVertical:10,borderRadius:8,flex:1,alignItems:"center",marginHorizontal:5}
});


export default CustomTimePicker;