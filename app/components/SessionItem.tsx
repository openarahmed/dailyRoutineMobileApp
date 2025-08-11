import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

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
    colors: any;
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

const SessionItem = React.memo(({ item, onToggle, onEdit, onDelete, colors }: SessionItemProps) => {
    const isCompleted = item.completed;
    
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
        <TouchableOpacity 
            style={[
                styles.sessionItem,
                { backgroundColor: isCompleted ? colors.sessionItemCompletedBg : colors.sessionItemBg },
                { borderColor: isCompleted ? colors.sessionItemCompletedBorder : colors.sessionItemBorder }
            ]} 
            onLongPress={showOptions} 
            activeOpacity={0.7}
        >
            <View style={[
                styles.taskIconContainer, 
                { 
                    backgroundColor: colors.taskIconContainerBg,
                    borderColor: colors.taskIconContainerBorder
                }
            ]}>
                <MaterialIcons name={taskIcon as any} size={22} color={taskIconColor} />
            </View>

            <View style={styles.taskTextContainer}>
                <Text style={[
                    styles.sessionTimeText, 
                    { color: isCompleted ? colors.sessionTimeTextCompleted : colors.sessionTimeText }
                ]}>
                    {`${item.start} - ${item.end}`}
                </Text>
                <Text 
                    style={[
                        styles.sessionText, 
                        { color: isCompleted ? colors.sessionTextCompleted : colors.sessionText },
                        isCompleted && { textDecorationLine: 'line-through' }
                    ]} 
                    numberOfLines={1}
                >
                    {item.title}
                </Text>
            </View>

            <TouchableOpacity onPress={() => onToggle(item)} style={styles.checkboxWrapper}>
                <View style={[
                    styles.checkboxBase, 
                    { borderColor: colors.checkboxBorder },
                    isCompleted && { 
                        backgroundColor: colors.checkboxCheckedBg, 
                        borderColor: colors.checkboxCheckedBorder 
                    }
                ]}>
                    {item.completed && <MaterialIcons name="check" size={18} color={colors.checkboxCheckmark} />}
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
        borderWidth: 1,
    },
    taskIconContainer:{
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent:'center',
        alignItems:'center',
        marginRight: 12,
        borderWidth: 2,
    },
    taskTextContainer:{
        flex:1,
        marginRight: 10,
    },
    sessionTimeText:{
        fontSize: 13,
    },
    sessionText:{
        fontSize: 15,
        marginTop: 2,
    },
    checkboxWrapper: {
        padding: 5,
    },
    checkboxBase: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default SessionItem;