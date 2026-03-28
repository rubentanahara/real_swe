import { NativeTabs } from 'expo-router/unstable-native-tabs'
import { useFabStore } from '@/stores/useFabStore'

export default function TabLayout() {
  const setPreviousTab = useFabStore((s) => s.setPreviousTab)

  return (
    <NativeTabs
      screenListeners={({ route }) => ({
        tabPress: () => {
          if (route.name !== 'library') {
            setPreviousTab(route.name)
          }
        },
      })}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="house.fill" md="home_filled" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="leaderboard">
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" md="leaderboard" />
        <NativeTabs.Trigger.Label>Leaderboard</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="library" role="search">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'plus.circle.fill', selected: 'xmark.circle.fill' }}
          md="add"
          selectedColor="#111827"
        />
        <NativeTabs.Trigger.Label>Add</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
