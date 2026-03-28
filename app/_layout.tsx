import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryProvider } from '@/lib/query/provider'

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#100809' }}>
      <QueryProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#100809' } }} />
      </QueryProvider>
    </SafeAreaProvider>
  )
}
