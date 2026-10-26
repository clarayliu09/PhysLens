import { Linking, StyleSheet, Text } from "react-native";

import { PHYSICS_LINKS } from "../constants/physicsLinks";
import { COLORS } from "../constants/theme";

type Props = {
  text: string;
};

export default function LinkedExplanation({ text }: Props) {
  // Flatten all synonyms into individual searchable terms.
  // Longer phrases are matched first.
  const terms = PHYSICS_LINKS.flatMap(({ terms, url }) =>
    terms.map((term) => ({ term, url }))
  ).sort((a, b) => b.term.length - a.term.length);

  const escapedTerms = terms.map(({ term }) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  const regex = new RegExp(`\\b(${escapedTerms.join("|")})\\b`,"gi");

  const parts = text.split(regex);

  return (
    <Text style={styles.explanation}>
      {parts.map((part, index) => {
        const match = terms.find(({ term }) => term.toLowerCase() === part.toLowerCase());

        if (!match) {
          return <Text key={index}>{part}</Text>;
        }

        return (
          <Text
            key={index}
            style={styles.link}
            onPress={() => {
              void Linking.openURL(match.url);
            }}
            accessibilityRole="link"
          >
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  explanation: {
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.text,
  },

  link: {
    color: "#2877B8",
    textDecorationLine: "underline",
    fontWeight: "600",
  },
});