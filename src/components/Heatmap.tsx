import { useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { HeatCell } from '@/lib/heatmap';

const LEVEL_COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];

export function Heatmap({ cells }: { cells: HeatCell[][] }) {
  const scroll = useRef<ScrollView>(null);
  return (
    <ScrollView
      ref={scroll}
      horizontal
      showsHorizontalScrollIndicator={false}
      onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
      <View style={styles.grid}>
        {cells.map((column) => (
          <View key={column[0].date} style={styles.column}>
            {column.map((cell) => (
              <View
                key={cell.date}
                accessibilityLabel={`${cell.date}: ${cell.count} sets`}
                style={[
                  styles.cell,
                  { backgroundColor: cell.future ? 'transparent' : LEVEL_COLORS[cell.level] },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 3 },
  column: { gap: 3 },
  cell: { width: 12, height: 12, borderRadius: 2 },
});
