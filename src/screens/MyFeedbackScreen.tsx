import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Title, Chip, ActivityIndicator, IconButton, Button } from 'react-native-paper';
import { feedbackAPI } from '../services/feedbackApi';
import { SafeAreaView } from 'react-native-safe-area-context';

type FeedbackItem = {
  _id: string;
  content: string;
  type: string;
  status: 'pending' | 'in_progress' | 'resolved';
  createdAt: string;
};

export const MyFeedbackScreen = ({ navigation }: any) => {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleDelete = async (feedbackId: string) => {
    Alert.alert(
      'Delete Feedback',
      'Are you sure you want to delete this feedback?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await feedbackAPI.deleteFeedback(feedbackId);
              loadFeedback(); // Refresh the list
            } catch (error) {
              Alert.alert('Error', 'Failed to delete feedback');
            }
          },
        },
      ]
    );
  };

  const loadFeedback = async () => {
    try {
      const response = await feedbackAPI.getUserFeedback();
      setFeedback(response.data);
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFeedback();
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return '#4CAF50';
      case 'in_progress':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>My Feedback History</Title>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
        >
          Done
        </Button>
      </View>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {feedback.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>
                You haven't submitted any feedback yet.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          feedback.map((item) => (
            <Card key={item._id} style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Chip
                    mode="outlined"
                    style={[
                      styles.typeChip,
                      { borderColor: item.type === 'bug' ? '#f44336' : '#2196F3' },
                    ]}
                    textStyle={{
                      color: item.type === 'bug' ? '#f44336' : '#2196F3',
                    }}
                  >
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </Chip>
                  <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                </View>
                <Text style={styles.content}>{item.content}</Text>
                <View style={styles.footer}>
                <View style={styles.footerLeft}>
                  <Chip
                    mode="flat"
                    style={[
                      styles.statusChip,
                      { backgroundColor: getStatusColor(item.status) + '20' },
                    ]}
                    textStyle={{ color: getStatusColor(item.status) }}
                  >
                    {item.status.replace('_', ' ').toUpperCase()}
                  </Chip>
                </View>
                <IconButton
                  icon="delete-outline"
                  iconColor="#f44336"
                  size={20}
                  onPress={() => handleDelete(item._id)}
                  style={styles.deleteButton}
                />
              </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  cancelButton: {
    marginLeft: 'auto',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 16,
    marginHorizontal: 16,
    color: '#333',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  emptyCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeChip: {
    backgroundColor: 'transparent',
  },
  date: {
    color: '#666',
    fontSize: 12,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flex: 1,
  },
  deleteButton: {
    margin: 0,
  },
  statusChip: {
    marginLeft: 8,
  },
});
