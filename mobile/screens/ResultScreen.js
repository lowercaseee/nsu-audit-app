import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default function ResultScreen({ navigation, route }) {
  const { result, email } = route.params;
  const { student, courses, audit, result: status } = result;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Audit Result</Text>
        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Text style={styles.backButton}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.statusCard, status === 'GRADUATED' ? styles.successCard : styles.failCard]}>
          <Text style={styles.statusText}>{status}</Text>
          <Text style={styles.studentName}>{student?.name}</Text>
          <Text style={styles.studentId}>ID: {student?.id}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Level 1: Credits</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Total Credits</Text>
              <Text style={styles.value}>{audit?.level1?.totalCredits}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Valid Courses</Text>
              <Text style={styles.value}>{audit?.level1?.valid}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Level 2: CGPA</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>CGPA</Text>
              <Text style={styles.value}>{audit?.level2?.cgpa}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Credits</Text>
              <Text style={styles.value}>{audit?.level2?.credits}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Level 3: Eligibility</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Eligible</Text>
              <Text style={[styles.value, audit?.level3?.eligible ? styles.success : styles.fail]}>
                {audit?.level3?.eligible ? 'YES' : 'NO'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Credit Deficit</Text>
              <Text style={styles.value}>{audit?.level3?.creditDeficit}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Course List ({courses?.length || 0})</Text>
          <View style={styles.card}>
            {courses?.slice(0, 10).map((course, index) => (
              <View key={index} style={styles.courseRow}>
                <Text style={styles.courseCode}>{course.code}</Text>
                <Text style={styles.courseGrade}>{course.grade}</Text>
                <Text style={styles.courseCredits}>{course.credits}</Text>
              </View>
            ))}
            {courses?.length > 10 && (
              <Text style={styles.moreText}>+ {courses.length - 10} more courses</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#003366',
    padding: 16,
    paddingTop: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    color: '#fff',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  successCard: {
    backgroundColor: '#dcfce7',
  },
  failCard: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#16a34a',
    marginBottom: 8,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  studentId: {
    fontSize: 14,
    color: '#64748b',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  label: {
    color: '#64748b',
    fontSize: 14,
  },
  value: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '600',
  },
  success: {
    color: '#16a34a',
  },
  fail: {
    color: '#dc2626',
  },
  courseRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  courseCode: {
    flex: 1,
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '500',
  },
  courseGrade: {
    width: 50,
    color: '#1e293b',
    fontSize: 14,
    textAlign: 'center',
  },
  courseCredits: {
    width: 50,
    color: '#64748b',
    fontSize: 14,
    textAlign: 'right',
  },
  moreText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
    marginTop: 8,
  },
});