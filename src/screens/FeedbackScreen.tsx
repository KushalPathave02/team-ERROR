import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Text, TextInput, Button, SegmentedButtons } from 'react-native-paper';
import { feedbackAPI, FeedbackData } from '../services/feedbackApi';
import { SafeAreaView } from 'react-native-safe-area-context';

export const FeedbackScreen = () => {
  const [content, setContent] = useState('');
  const [type, setType] = useState<FeedbackData['type']>('suggestion');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter your feedback');
      return;
    }

    try {
      setIsSubmitting(true);
      await feedbackAPI.submitFeedback({
        content: content.trim(),
        type
      });

      Alert.alert(
        'Success',
        'Thank you for your feedback! We appreciate your input.',
        [
          {
            text: 'OK',
            onPress: () => {
              setContent('');
              setType('suggestion');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to submit feedback'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="headlineMedium" style={styles.title}>
            We Value Your Feedback
          </Text>
          
          <Text variant="bodyMedium" style={styles.subtitle}>
            Help us improve by sharing your suggestions, questions, or reporting issues.
          </Text>

          <View style={styles.form}>
            <SegmentedButtons
              value={type}
              onValueChange={value => setType(value as FeedbackData['type'])}
              buttons={[
                { value: 'suggestion', label: 'Suggestion' },
                { value: 'question', label: 'Question' },
                { value: 'bug', label: 'Bug' }
              ]}
              style={styles.segmentedButtons}
            />

            <TextInput
              mode="outlined"
              label="Your Feedback"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              style={styles.input}
              placeholder="Share your thoughts with us..."
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || !content.trim()}
              style={styles.button}
            >
              Submit Feedback
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  keyboardAvoid: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#1a73e8'
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#5f6368'
  },
  form: {
    gap: 20
  },
  segmentedButtons: {
    marginBottom: 8
  },
  input: {
    backgroundColor: '#fff'
  },
  button: {
    marginTop: 8,
    padding: 4
  }
});
