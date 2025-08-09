import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Type Definitions
export type Session = { 
  id: string; 
  title: string; 
  start: string; 
  end: string; 
  notificationId?: string;
  completed?: boolean;
  activeDays: number[];
  isOneTime?: boolean;
  createdAt?: number;
};

type SessionItemProps = { 
  item: Session; 
  onToggle: (item: Session) => Promise<void>; 
  onEdit: (item: Session) => void; 
  onDelete: (id: string) => void; 
};

const getIconStyle = (title: string): { name: string; color: string } => {
    const lowerCaseTitle = title.toLowerCase();
    if (lowerCaseTitle.includes("exercise") || lowerCaseTitle.includes("gym") || lowerCaseTitle.includes("workout")) return { name: "fitness-center", color: "#FF9500" };
    if (lowerCaseTitle.includes("study") || lowerCaseTitle.includes("math") || lowerCaseTitle.includes("science") || lowerCaseTitle.includes("homework")) return { name: "book", color: "#007AFF" };
    if (lowerCaseTitle.includes("breakfast") || lowerCaseTitle.includes("lunch") || lowerCaseTitle.includes("dinner")) return { name: "restaurant", color: "#34C759" };
    if (lowerCaseTitle.includes("break") || lowerCaseTitle.includes("relax")) return { name: "free-breakfast", color: "#AF52DE" };
    if (lowerCaseTitle.includes("read") || lowerCaseTitle.includes("journaling")) return { name: "menu-book", color: "#5856D6" };
    if (lowerCaseTitle.includes("work") || lowerCaseTitle.includes("office") || lowerCaseTitle.includes("meeting")) return { name: "work", color: "#5AC8FA" };
    if (lowerCaseTitle.includes("sleep") || lowerCaseTitle.includes("nap")) return { name: "hotel", color: "#8E8E93" };
    if (lowerCaseTitle.includes("walk") || lowerCaseTitle.includes("cardio")) return { name: "directions-walk", color: "#FFCF00" };
    if (lowerCaseTitle.includes("shopping") || lowerCaseTitle.includes("market")) return { name: "shopping-cart", color: "#FF3B30" };
    if (lowerCaseTitle.includes("code") || lowerCaseTitle.includes("develop")) return { name: "code", color: "#A2845E" };
    return { name: "list-alt", color: "#8E8E93" };
};

const SessionItem = React.memo(({ item, onToggle, onEdit, onDelete }: SessionItemProps) => {
  
  const showOptions = () => Alert.alert(
    item.title, 
    "What would you like to do?", 
    [
      { text: "Edit Task", onPress: () => onEdit(item) },
      { text: "Delete Task", style: "destructive", onPress: () => onDelete(item.id) },
      { text: "Cancel", style: "cancel" }
    ]
  );

  const { name: taskIcon, color: taskIconColor } = getIconStyle(item.title);

  return (
    // ✅ পরিবর্তন: LinearGradient সরিয়ে TouchableOpacity ব্যবহার করা হয়েছে
    <TouchableOpacity 
      style={[styles.sessionItem, item.completed && styles.sessionItemCompleted]} 
      onLongPress={showOptions} 
      activeOpacity={0.7}
    >
      <View style={styles.taskIconContainer}>
          <MaterialIcons name={taskIcon as any} size={22} color={taskIconColor} />
      </View>

      <View style={styles.taskTextContainer}>
          <Text style={[styles.sessionTimeText, item.completed && styles.sessionTextCompleted]}>
            {`${item.start} - ${item.end}`}
          </Text>
          <Text style={[styles.sessionText, item.completed && styles.sessionTextCompleted]} numberOfLines={1}>
            {item.title}
          </Text>
      </View>

      <TouchableOpacity onPress={() => onToggle(item)} style={styles.checkboxWrapper}>
          <View style={[styles.checkboxBase, item.completed && styles.checkboxChecked]}>
              {item.completed && <MaterialIcons name="check" size={18} color="#FFFFFF" />}
          </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
    sessionItem:{
        flexDirection:'row',
        alignItems:'center',
        padding: 12,
        marginBottom: 5,
        borderRadius: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.18)',
        borderWidth: 2,
        borderColor: 'rgba(113, 113, 113, 0.04)',
    },
    sessionItemCompleted:{
        backgroundColor:'rgba(0, 122, 255, 0.2)', 
        borderColor: 'rgba(0, 122, 255, 0.3)',
    },
    taskIconContainer:{
        width: 44,
        height: 44,
        borderRadius: 10, // ✅ পরিবর্তন: গোলাকার থেকে হালকা বাঁকানো হয়েছে
        justifyContent:'center',
        alignItems:'center',
        marginRight: 12,
        backgroundColor: '#272b3e70', // ✅ পরিবর্তন: গ্রে ব্যাকগ্রাউন্ড যোগ করা হয়েছে
         borderWidth: 2,
        borderColor: 'rgba(113, 113, 113, 0.1)',
    },
    taskTextContainer:{
        flex:1,
        marginRight: 10,
    },
    sessionTimeText:{
        color:'#AEAEB2',
        fontSize:13,
    },
    sessionText:{
        color:'#FFFFFF',
        fontSize:15,
        marginTop:2
    },
    sessionTextCompleted:{
        color:'#8E8E93',
        textDecorationLine:'line-through',
    },
    checkboxWrapper: {
        padding: 5,
    },
    checkboxBase: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#4A4466',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
});

export default SessionItem;
