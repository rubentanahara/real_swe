import { useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import { StyleSheet, View } from 'react-native'
import { useFabStore } from '@/stores/useFabStore'

export default function LibraryScreen() {
  const open = useFabStore((s) => s.open)
  const close = useFabStore((s) => s.close)

  useFocusEffect(
    useCallback(() => {
      open()
      return () => {
        close()
      }
    }, [open, close]),
  )

  return <View style={styles.fill} />
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
})
