import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TranscriptResult } from '../types';

export default function ResultScreen({ navigation, route }: any) {
  const { result, user } = route.params as { result: TranscriptResult; user: any };
  const { student, courses, audit, result: status } = result;

  const handleShare = async () => {
    try {
      const message = `
🎓 NSU Audit Result

Student: ${student?.name}
ID: ${student?.id}
Degree: ${student?.degree}

📊 Level 1 - Credits
Total Credits: ${audit?.level1?.totalCredits}
Valid Courses: ${audit?.level1?.valid}

📈 Level 2 - CGPA
CGPA: ${audit?.level2?.cgpa}
Credits: ${audit?.level2?.credits}

${status === 'GRADUATED' ? '✅ ELIGIBLE FOR GRADUATION' : '❌ NOT ELIGIBLE'}
      `.trim();

      await Share.share({ message });
    } catch (e) {
      console.log('Share error:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.degree}>{student?.degree}</Text>
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
            <View style={styles.row}>
              <Text style={styles.label}>Grade Points</Text>
              <Text style={styles.value}>{audit?.level2?.gradePoints?.toFixed(2) || 0}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Level 3: Eligibility</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Eligible</Text>
              <Text style={[styles.value, status === 'GRADUATED' ? styles.success : styles.fail]}>
                {status === 'GRADUATED' ? 'YES' : 'NO'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Credit Deficit</Text>
              <Text style={styles.value}>{audit?.level3?.creditDeficit}</Text>
            </View>
            {audit?.level3?.missingCourses && (
              <>
                {audit.level3.missingCourses.mandatoryGed?.length > 0 && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Missing GED</Text>
                    <Text style={styles.value}>{audit.level3.missingCourses.mandatoryGed.join(', ')}</Text>
                  </View>
                )}
                {audit.level3.missingCourses.majorCore?.length > 0 && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Missing Major</Text>
                    <Text style={styles.value}>{audit.level3.missingCourses.majorCore.join(', ')}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Course List ({courses?.length || 0})</Text>
          <View style={styles.card}>
            {courses?.slice(0, 15).map((course: any, index: number) => (
              <View key={index} style={styles.courseRow}>
                <Text style={styles.courseCode}>{course.code}</Text>
                <Text style={styles.courseGrade}>{course.grade}</Text>
                <Text style={styles.courseCredits}>{course.credits}</Text>
              </View>
            ))}
            {(courses?.length || 0) > 15 && (
              <Text style={styles.moreText}>+ {(courses?.length || 0) - 15} more courses</Text>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Share Results</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  degree: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
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
  shareButton: {
    backgroundColor: '#003366',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});