import { Slot } from "expo-router";
import AppProvider from "./context/AppContext"; // ✅ Context Wrapper

export default function Layout() {
  return (
    
    <AppProvider>
      <Slot />
    </AppProvider>
  );
}
