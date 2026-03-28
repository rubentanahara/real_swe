import Ionicons from '@expo/vector-icons/Ionicons'
import { router, Stack } from 'expo-router'
import type { ComponentProps } from 'react'
import { useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text } from 'react-native'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { QueryProvider } from '@/lib/query/provider'
import { useFabStore } from '@/stores/useFabStore'

type IoniconsName = ComponentProps<typeof Ionicons>['name']

const TAB_BAR_HEIGHT = 49

const ACTIONS: { id: string; icon: IoniconsName; label: string }[] = [
  { id: 'log-exercise', icon: 'barbell-outline', label: 'Log exercise' },
  { id: 'saved', icon: 'bookmark-outline', label: 'Saved foods' },
  { id: 'database', icon: 'search-outline', label: 'Food database' },
  { id: 'scan', icon: 'scan-outline', label: 'Scan food' },
]

function FabOverlay() {
  const { bottom } = useSafeAreaInsets()
  const { isOpen, close, previousTabName } = useFabStore()

  const backdropOpacity = useRef(new Animated.Value(0)).current
  const gridOpacity = useRef(new Animated.Value(0)).current
  const gridTranslateY = useRef(new Animated.Value(20)).current
  const prevIsOpen = useRef(false)

  if (isOpen !== prevIsOpen.current) {
    prevIsOpen.current = isOpen
    if (isOpen) {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(gridOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(gridTranslateY, {
          toValue: 0,
          damping: 18,
          stiffness: 220,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(gridOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(gridTranslateY, { toValue: 20, duration: 160, useNativeDriver: true }),
      ]).start()
    }
  }

  const handleClose = () => {
    close()
    const path = previousTabName === 'index' ? '/' : `/${previousTabName}`
    router.navigate(path as Parameters<typeof router.navigate>[0])
  }

  return (
    <>
      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <Pressable style={styles.backdropFill} onPress={handleClose} />
      </Animated.View>

      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[
          styles.grid,
          {
            bottom: TAB_BAR_HEIGHT + bottom + 16,
            opacity: gridOpacity,
            transform: [{ translateY: gridTranslateY }],
          },
        ]}
      >
        {ACTIONS.map((action) => (
          <Pressable
            key={action.id}
            style={styles.gridButton}
            onPress={() => {
              handleClose()
              // TODO: handle action.id
            }}
          >
            <Ionicons name={action.icon} size={26} color="#111827" />
            <Text style={styles.gridLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </Animated.View>
    </>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <FabOverlay />
      </QueryProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backdropFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  grid: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  gridButton: {
    width: '47%',
    paddingVertical: 22,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  gridLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
})
