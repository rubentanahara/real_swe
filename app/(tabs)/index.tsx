import { useFocusEffect } from 'expo-router'
import { useState, useCallback } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function HomeScreen() {
  const [ready, setReady] = useState(false)

  useFocusEffect(
    useCallback(() => {
      setReady(true)
    }, []),
  )

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#fff" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Home</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#100809', alignItems: 'center', justifyContent: 'center' },
  safe: { flex: 1, backgroundColor: '#100809' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
})
