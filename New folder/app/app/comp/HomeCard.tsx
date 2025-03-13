import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";

// ✅ Define TypeScript interface for items
interface KfcItem {
  id: number;
  image: any; // Image source
  name: string;
}

// ✅ KFC Menu Data (Images should be in assets folder)
const Kfc: KfcItem[] = [
  { id: 1, image: require("../comp/images/chocolates.webp"), name: "All" },
  { id: 2, image: require("./images/Pica-enhance-20250306204752.png"), name: "Drinks" },
  { id: 3, image: require("./images/Pica-enhance-20250306210322.png"), name: "Snacks" },
  { id: 4, image: require("./images/grossery.png"), name: "Groceries" },
];

interface HomeCardProps {
  name: string;
}

const HomeCard: React.FC<HomeCardProps> = ({ name }) => {
  const router = useRouter(); // ✅ React Native Navigation

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{name}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.cardsContainer}>
          {Kfc.map((item, index) => {
            // ✅ Define route dynamically
            const route =
              index === 1 ? "/comp/Drinks" : index === 2 ? "/comp/Snacks" : index === 3 ? "/comp/Groceries" : "/Main";

            return (
              <TouchableOpacity key={item.id} onPress={() => router.push(route)} style={styles.card}>
                <Image source={item.image} style={styles.image} resizeMode="contain" />
                <Text style={styles.cardText}>{item.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeCard;

// ✅ Styles for better UI
const styles = StyleSheet.create({
  container: { marginBottom: 2, padding: 1 },
  header: { fontSize: 20, fontWeight: "bold", },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "nowrap", // Ensure no wrapping
    alignItems: "center",
  },
  card: {
    alignItems: "center",
      marginRight: 1,
      marginLeft: 10,  // Add spacing between cards
    borderRadius: 10,
   
  },
  image: {
    width: 90,
    height: 40,
    borderRadius: 10,
  },
  cardText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    
  },
});
