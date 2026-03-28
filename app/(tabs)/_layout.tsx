import { NativeTabs } from 'expo-router/unstable-native-tabs'

export default function TabLayout() {
  return (
    <NativeTabs backgroundColor="#100809">
      <NativeTabs.Trigger name="index" contentStyle={{ backgroundColor: '#100809' }}>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home_filled" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore" contentStyle={{ backgroundColor: '#100809' }}>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="leaderboard" contentStyle={{ backgroundColor: '#100809' }}>
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" md="leaderboard" />
        <NativeTabs.Trigger.Label>Leaderboard</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="library" contentStyle={{ backgroundColor: '#100809' }}>
        <NativeTabs.Trigger.Icon sf="books.vertical.fill" md="library_books" />
        <NativeTabs.Trigger.Label>Library</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings" contentStyle={{ backgroundColor: '#100809' }}>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
