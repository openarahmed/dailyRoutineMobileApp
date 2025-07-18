import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Type Definitions
type Session = { 
  id: string; 
  title: string; 
  start: string; 
  end: string; 
  completed?: boolean; 
};

type SessionItemProps = { 
  item: Session; 
  onToggle: (item: Session) => void; 
  onEdit: (item: Session) => void; 
  onDelete: (id: string) => void; 
};

// Helper function to get an icon for each task
const getIconForTask = (title: string) => {
    const lowerCaseTitle = title.toLowerCase();
    if (lowerCaseTitle.includes("exercise") || lowerCaseTitle.includes("gym")) return "fitness-center";
    if (lowerCaseTitle.includes("study") || lowerCaseTitle.includes("math") || lowerCaseTitle.includes("science")) return "book";
    if (lowerCaseTitle.includes("breakfast") || lowerCaseTitle.includes("lunch") || lowerCaseTitle.includes("dinner")) return "restaurant";
    if (lowerCaseTitle.includes("break")) return "free-breakfast";
    if (lowerCaseTitle.includes("read")) return "menu-book";
    return "list-alt";
};

// The SessionItem Component
const SessionItem = React.memo(({ item, onToggle, onEdit, onDelete }: SessionItemProps) => {
  
  // Alert for deleting a session
  const handleDeletePress = () => Alert.alert(
    "Delete Session", 
    "Are you sure you want to delete this session?", 
    [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete(item.id) }
    ]
  );

  const taskIcon = getIconForTask(item.title);
  const itemContainerStyle = item.completed 
    ? [styles.sessionItem, styles.sessionItemCompleted] 
    : styles.sessionItem;

  return (
    // The main container is a View
    <View style={itemContainerStyle}>
        {/* The left icon is the only touchable area to toggle completion */}
        <TouchableOpacity onPress={() => onToggle(item)} style={[styles.taskIconContainer, item.completed && styles.taskIconContainerCompleted]}>
            {item.completed 
              ? <MaterialIcons name="check" size={24} color="#FFFFFF" /> 
              : <MaterialIcons name={taskIcon as any} size={22} color="#FFFFFF" />
            }
        </TouchableOpacity>

        {/* Middle Text Content */}
        <View style={styles.taskTextContainer}>
            <Text style={[styles.sessionTimeText, item.completed && styles.sessionTextCompleted]}>
              {`${item.start} - ${item.end}`}
            </Text>
            <Text style={[styles.sessionText, item.completed && styles.sessionTextCompleted]} numberOfLines={1}>
              {item.title}
            </Text>
        </View>

        {/* Right Action Buttons */}
        {!item.completed && (
            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity style={styles.iconButton} onPress={() => onEdit(item)}>
                  <MaterialIcons name="edit" size={20} color="#A0A0A0" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={handleDeletePress}>
                  <MaterialIcons name="delete" size={20} color="#FF6347" />
                </TouchableOpacity>
            </View>
        )}
    </View>
  );
});

// Stylesheet for the component
const styles = StyleSheet.create({
    sessionItem:{
        flexDirection:'row',
        alignItems:'center',
        padding: 12,
        marginBottom: 12,
        borderRadius: 18,
        // ✅ আপনার পরামর্শ অনুযায়ী, শ্যাডো সরিয়ে একটি ডার্ক ট্রান্সপারেন্ট ব্যাকগ্রাউন্ড ব্যবহার করা হয়েছে
        backgroundColor: 'rgba(0, 0, 0, 0.1)', // কালো রঙের হালকা অপাসিটি
        borderWidth: 2,
        borderColor: 'rgba(154, 152, 152, 0.06)', // একটি হালকা বর্ডার
    },
    sessionItemCompleted:{
        backgroundColor:'rgba(0, 122, 255, 0.2)', 
        borderColor: 'rgba(0, 122, 255, 0.3)',
    },
    taskIconContainer:{
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent:'center',
        alignItems:'center',
        backgroundColor:'rgba(67, 67, 68, 0.18)', 
        marginRight: 12,
        
    },
    taskIconContainerCompleted:{
        backgroundColor:'#007AFF',
    },
    taskTextContainer:{
        flex:1
    },
    sessionTimeText:{
        color:'#AEAEB2',
        fontSize:14,
        fontWeight:'500'
    },
    sessionText:{
        color:'#FFFFFF',
        fontSize:17,
        fontWeight:'600',
        marginTop:2
    },
    sessionTextCompleted:{
        color:'#8E8E93',
        textDecorationLine:'line-through',
    },
    actionButtonsContainer:{
        flexDirection:'row',
        alignItems:'center'
    },
    iconButton:{
        marginLeft:4,
        padding:6
    }
});

export default SessionItem;
