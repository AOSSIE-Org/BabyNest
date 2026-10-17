import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {LineChart, BarChart} from 'react-native-gifted-charts';

const METRIC_CONFIG = {
  appointment_metric: {
    title: 'Appointments by Week',
    color: '#DA4F7A',
    unit: 'appointments',
  },
  task_metric: {
    title: 'Tasks by Week',
    color: '#8B5CF6',
    unit: 'tasks',
  },
  blood_pressure_metric: {
    title: 'Blood Pressure by Week',
    color: '#DA4F7A',
    unit: 'mmHg',
  },
  discharge_metric: {
    title: 'Discharge Logs by Week',
    color: '#F59E0B',
    unit: 'records',
  },
  weight_metric: {
    title: 'Weight by Week',
    color: '#0D9488',
    unit: 'kg',
  },
  medicine_metric: {
    title: 'Medicines Taken by Week',
    color: '#3B82F6',
    unit: 'doses',
  },
  symptom_metric: {
    title: 'Symptoms by Week',
    color: '#EF4444',
    unit: 'records',
  },
};

const AnalyticsGraph = ({metric, data}) => {
  const [graphType, setGraphType] = useState('line');

  const GRAPH_TYPES = [
    {label: 'Line', value: 'line'},
    {label: 'Bar', value: 'bar'},
    {label: 'Area', value: 'area'},
  ];
  const {width: screenWidth, height: screenHeight} = useWindowDimensions();

  const [modalVisible, setModalVisible] = useState(false);

  const config = METRIC_CONFIG[metric];

  if (!config || !Array.isArray(data) || data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No analytics data available yet.</Text>
      </View>
    );
  }

  const validData = data.filter(
    item =>
      Number.isFinite(Number(item.week)) && Number.isFinite(Number(item.log)),
  );

  const chartData = validData.map(item => ({
    value: Number(item.log),
    label: `W${item.week}`,
  }));

  if (chartData.length === 0) {
    return (
      <Text style={styles.emptyText}>No valid data points to display.</Text>
    );
  }

  const isBloodPressure = metric === 'blood_pressure_metric';

  // Match diastolic values to the same weeks as systolic values.
  const diastolicData = isBloodPressure
    ? validData.map(item => ({
        value: Number(item.diastolic),
        label: `W${item.week}`,
      }))
    : [];

  const hasDiastolic =
    isBloodPressure &&
    validData.every(item => Number.isFinite(Number(item.diastolic)));

  const renderChart = (expanded = false) => {
    const chartWidth = expanded
      ? Math.max(150, screenWidth - 32)
      : Math.max(150, screenWidth - 92);

    const chartHeight = expanded ? Math.min(300, screenHeight * 0.42) : 70;

    const commonProps = {
      data: chartData,
      width: chartWidth,
      height: chartHeight,
      isAnimated: true,
      noOfSections: 4,
      showFractionalValues: true,
      xAxisColor: '#E5D5DC',
      yAxisColor: '#E5D5DC',
      rulesColor: '#F0E5E9',
      xAxisLabelTextStyle: expanded ? styles.axisLabel : styles.smallAxisLabel,
      yAxisTextStyle: expanded ? styles.axisLabel : styles.smallAxisLabel,
    };

    if (graphType === 'bar') {
      return (
        <BarChart
          {...commonProps}
          {...(hasDiastolic
            ? {
                data2: diastolicData,
                bar2Color: '#3B82F6',
              }
            : {})}
          barWidth={expanded ? 18 : 10}
          spacing={expanded ? 16 : 8}
          roundedTop
          frontColor={config.color}
          barBorderRadius={4}
          yAxisThickness={0}
          xAxisThickness={1}
        />
      );
    }

    return (
      <LineChart
        {...commonProps}
        {...(hasDiastolic
          ? {
              data2: diastolicData,
              color2: '#3B82F6',
            }
          : {})}
        curved
        areaChart={graphType === 'area'}
        color={config.color}
        thickness={expanded ? 3 : 2}
        dataPointsColor={config.color}
        dataPointsRadius={expanded ? 8 : 4}
        hideDataPoints={false}
        startFillColor={config.color}
        endFillColor="#FFFFFF"
        startOpacity={0.25}
        endOpacity={0.02}
        showVerticalLines={expanded}
        verticalLinesColor="#F3E4E9"
        initialSpacing={expanded ? 12 : 6}
        endSpacing={expanded ? 12 : 6}
      />
    );
  };

  return (
    <>
      {/* Compact clickable preview */}
      <Pressable
        style={({pressed}) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`Expand ${config.title} graph`}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>Weekly overview · {config.unit}</Text>
          </View>
        </View>
        <View style={styles.graphTypeContainer}>
          {GRAPH_TYPES.map(type => {
            const selected = graphType === type.value;

            return (
              <Pressable
                key={type.value}
                onPress={() => setGraphType(type.value)}
                style={[
                  styles.graphTypeButton,
                  selected && styles.graphTypeButtonActive,
                ]}
                accessibilityRole="button"
                accessibilityState={{selected}}>
                <Text
                  style={[
                    styles.graphTypeText,
                    selected && styles.graphTypeTextActive,
                  ]}>
                  {type.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {isBloodPressure && (
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, {backgroundColor: '#DA4F7A'}]} />
              <Text style={styles.legendText}>Systolic</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.dot, {backgroundColor: '#3B82F6'}]} />
              <Text style={styles.legendText}>Diastolic</Text>
            </View>
          </View>
        )}

        <View style={styles.previewChart}>{renderChart(false)}</View>

        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>
            {chartData.length} weekly data points
          </Text>
          <Text style={styles.tapText}>Tap to expand</Text>
        </View>
      </Pressable>

      {/* Full-screen graph modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{config.title}</Text>

            <Pressable
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close graph">
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>
          </View>

          {isBloodPressure && (
            <View style={styles.modalLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.dot, {backgroundColor: '#DA4F7A'}]} />
                <Text style={styles.legendText}>Systolic</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.dot, {backgroundColor: '#3B82F6'}]} />
                <Text style={styles.legendText}>Diastolic</Text>
              </View>
            </View>
          )}

          <View style={styles.expandedChart}>{renderChart(true)}</View>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F4DDE6',
  },
  cardPressed: {
    backgroundColor: '#FFFAFC',
    opacity: 0.92,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#29212A',
  },
  subtitle: {
    fontSize: 12,
    color: '#887681',
    marginTop: 4,
  },
  previewChart: {
    alignItems: 'center',
    marginTop: 12,
    overflow: 'hidden',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F7EAF0',
  },
  footerText: {
    fontSize: 11,
    color: '#887681',
  },
  tapText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DA4F7A',
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  modalLegend: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  graphTypeContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#F8F1F4',
    gap: 4,
  },
  graphTypeButton: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  graphTypeButtonActive: {
    backgroundColor: '#DA4F7A',
  },
  graphTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#887681',
  },
  graphTypeTextActive: {
    color: '#FFFFFF',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#66545E',
  },
  smallAxisLabel: {
    fontSize: 8,
    color: '#887681',
  },
  axisLabel: {
    fontSize: 11,
    color: '#887681',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#29212A',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 30,
    lineHeight: 34,
    color: '#DA4F7A',
  },
  expandedChart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  empty: {
    padding: 16,
    backgroundColor: '#FFF5F8',
    borderRadius: 12,
  },
  emptyText: {
    color: '#887681',
    fontSize: 13,
  },
});

export default AnalyticsGraph;
