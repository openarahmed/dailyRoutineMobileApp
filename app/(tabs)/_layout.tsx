import { Ionicons } from "@expo/vector-icons";
import type { ParamListBase, RouteProp } from "@react-navigation/native";
import { Tabs } from "expo-router";

export default function Layout() {
  return (
    <Tabs
      screenOptions={({
        route,
      }: {
        route: RouteProp<ParamListBase, string>;
      }) => ({
        tabBarIcon: ({ color, size }: { color: string; size: number }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "help-circle";

          switch (route.name) {
            case "index":
              iconName = "home";
              break;
            case "create":
              iconName = "add-circle";
              break;
            case "settings":
              iconName = "settings";
              break;
            case "template":
              iconName = "albums"; // icon for Templates tab
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#007bff",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="create" options={{ title: "Create" }} />
      <Tabs.Screen name="template" options={{ title: "Templates" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
