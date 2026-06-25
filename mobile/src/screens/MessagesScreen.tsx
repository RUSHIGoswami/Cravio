import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { StateView } from '../components/feedback/StateView';

/** Messages — empty-state placeholder (per the UI kit). */
export function MessagesScreen() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgBase, justifyContent: 'center' }}>
      <StateView mode="empty" title="No messages yet" message="Conversations with brands and creators will show up here." />
    </View>
  );
}
