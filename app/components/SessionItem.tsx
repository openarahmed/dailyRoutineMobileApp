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

// ✅✅✅ উন্নত এবং বিস্তৃত getIconForTask ফাংশন ✅✅✅
const getIconForTask = (title: string) => {
    const lower = title.toLowerCase();

    // Specific Activities (বেশি নির্দিষ্ট কাজগুলো আগে চেক করা হচ্ছে)
    if (lower.includes("code review")) return "rate-review";
    if (lower.includes("stand-up") || lower.includes("meeting")) return "people";
    if (lower.includes("yoga") || lower.includes("meditation")) return "self-improvement";
    if (lower.includes("prayer") || lower.includes("namaz")) return "spa";
    if (lower.includes("cardio") || lower.includes("running") || lower.includes("walk")) return "directions-run";
    if (lower.includes("strength training") || lower.includes("gym") || lower.includes("exercise") || lower.includes("workout")) return "fitness-center";
    if (lower.includes("script writing") || lower.includes("journaling") || lower.includes("writer")) return "edit";
    if (lower.includes("recording") || lower.includes("videos") || lower.includes("content creator")) return "videocam";
    if (lower.includes("painting") || lower.includes("sketching") || lower.includes("artist")) return "palette";
    if (lower.includes("shopping") || lower.includes("grocery") || lower.includes("market")) return "shopping-cart";
    if (lower.includes("email") || lower.includes("communication") || lower.includes("calls") || lower.includes("client")) return "email";
    if (lower.includes("social media") || lower.includes("engagement")) return "share";
    if (lower.includes("analytics") || lower.includes("report")) return "analytics";
    if (lower.includes("plan") || lower.includes("strategy") || lower.includes("scheduling")) return "event-note";
    
    // General Categories (সাধারণ কাজ)
    if (lower.includes("code") || lower.includes("develop") || lower.includes("coding") || lower.includes("debug")) return "code";
    if (lower.includes("study") || lower.includes("homework") || lower.includes("revision") || lower.includes("lectures") || lower.includes("student")) return "school";
    if (lower.includes("read") || lower.includes("book") || lower.includes("literature")) return "menu-book";
    if (lower.includes("work") || lower.includes("office") || lower.includes("project")) return "work";
    if (lower.includes("breakfast") || lower.includes("lunch") || lower.includes("dinner")) return "restaurant";
    if (lower.includes("break") || lower.includes("relax") || lower.includes("leisure")) return "free-breakfast";
    if (lower.includes("sleep") || lower.includes("nap")) return "hotel";
    if (lower.includes("clean")) return "cleaning-services";
    if (lower.includes("commute") || lower.includes("travel")) return "commute";
    if (lower.includes("family")) return "family-restroom";
    if (lower.includes("health") || lower.includes("doctor") || lower.includes("therapy")) return "medical-services";
    if (lower.includes("wake up") || lower.includes("prepare")) return "wb-sunny";
    if (lower.includes("hobby") || lower.includes("personal")) return "star";

    // Default Icon (যদি কোনো কিছুই না মেলে)
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
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 2,
        borderColor: 'rgba(154, 152, 152, 0.06)',
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