// import { Ionicons } from "@expo/vector-icons";
// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import { NavigationContainer } from "@react-navigation/native";
// import React from "react";

// import CreateRoutineScreen from "./screens/CreateRoutineScreen";
// import HomeScreen from "./screens/HomeScreen";
// import SettingsScreen from "./screens/SettingsScreen";

// const Tab = createBottomTabNavigator();

// export default function App() {
//   return (
//     <NavigationContainer>
//       <Tab.Navigator
//         screenOptions={({ route }) => ({
//           tabBarIcon: ({ color, size }) => {
//             let iconName: any;

//             if (route.name === "Home") {
//               iconName = "home";
//             } else if (route.name === "Create") {
//               iconName = "add-circle";
//             } else if (route.name === "Settings") {
//               iconName = "settings";
//             }

//             return <Ionicons name={iconName} size={size} color={color} />;
//           },
//           tabBarActiveTintColor: "#007bff",
//           tabBarInactiveTintColor: "gray",
//           headerShown: false,
//         })}
//       >
//         <Tab.Screen name="Home" component={HomeScreen} />
//         <Tab.Screen name="Create" component={CreateRoutineScreen} />
//         <Tab.Screen name="Settings" component={SettingsScreen} />
//       </Tab.Navigator>
//     </NavigationContainer>
//   );
// }
