import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:google_sign_in/google_sign_in.dart';

void main() {
  runApp(const NSUAuditApp());
}

class NSUAuditApp extends StatelessWidget {
  const NSUAuditApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NSU Audit',
      themeMode: ThemeMode.dark,
      theme: ThemeData(
        primarySwatch: Colors.deepOrange,
        primaryColor: const Color(0xFF003366),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        useMaterial3: true,
        brightness: Brightness.light,
      ),
      darkTheme: ThemeData(
        primarySwatch: Colors.deepOrange,
        primaryColor: const Color(0xFF003366),
        scaffoldBackgroundColor: const Color(0xFF121212),
        useMaterial3: true,
        brightness: Brightness.dark,
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF1E1E1E),
          foregroundColor: Colors.white,
        ),
        cardTheme: const CardThemeData(
          color: Color(0xFF1E1E1E),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF003366),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFF2C2C2C),
        ),
      ),
      routes: {
        '/login': (context) => const LoginScreen(),
        '/home': (context) => const HomeScreen(),
        '/result': (context) => const ResultScreen(),
        '/history': (context) => const HistoryScreen(),
        '/certificates': (context) => const CertificatesScreen(),
        '/settings': (context) => const SettingsScreen(),
      },
      home: const LoginScreen(),
    );
  }
}

// Models
class Student {
  final String name;
  final String id;
  final String dob;
  final String degree;

  Student({required this.name, required this.id, required this.dob, required this.degree});

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      name: json['name'] ?? '',
      id: json['id'] ?? '',
      dob: json['dob'] ?? '',
      degree: json['degree'] ?? '',
    );
  }
}

class Course {
  final String code;
  final String grade;
  final double credits;
  final String semester;

  Course({required this.code, required this.grade, required this.credits, required this.semester});

  factory Course.fromJson(Map<String, dynamic> json) {
    return Course(
      code: json['code'] ?? '',
      grade: json['grade'] ?? '',
      credits: (json['credits'] ?? 0).toDouble(),
      semester: json['semester'] ?? '',
    );
  }
}

class AuditResult {
  final int totalCredits;
  final int validCourses;
  final double cgpa;
  final int credits;
  final double gradePoints;
  final bool eligible;
  final int creditDeficit;
  final Map<String, List<String>> missingCourses;

  AuditResult({
    required this.totalCredits,
    required this.validCourses,
    required this.cgpa,
    required this.credits,
    required this.gradePoints,
    required this.eligible,
    required this.creditDeficit,
    required this.missingCourses,
  });

  factory AuditResult.fromJson(Map<String, dynamic> json) {
    final level1 = json['level1'] ?? {};
    final level2 = json['level2'] ?? {};
    final level3 = json['level3'] ?? {};
    final missing = level3['missingCourses'] ?? {};

    return AuditResult(
      totalCredits: level1['totalCredits'] ?? 0,
      validCourses: level1['valid'] ?? 0,
      cgpa: (level2['cgpa'] ?? 0).toDouble(),
      credits: level2['credits'] ?? 0,
      gradePoints: (level2['gradePoints'] ?? 0).toDouble(),
      eligible: level3['eligible'] ?? false,
      creditDeficit: level3['creditDeficit'] ?? 0,
      missingCourses: {
        'mandatoryGed': List<String>.from(missing['mandatoryGed'] ?? []),
        'coreMath': List<String>.from(missing['coreMath'] ?? []),
        'coreBusiness': List<String>.from(missing['coreBusiness'] ?? []),
        'majorCore': List<String>.from(missing['majorCore'] ?? []),
      },
    );
  }
}

class TranscriptResult {
  final Student student;
  final List<Course> courses;
  final AuditResult audit;
  final String result;

  TranscriptResult({
    required this.student,
    required this.courses,
    required this.audit,
    required this.result,
  });

  factory TranscriptResult.fromJson(Map<String, dynamic> json) {
    return TranscriptResult(
      student: Student.fromJson(json['student'] ?? {}),
      courses: (json['courses'] as List<dynamic>?)?.map((c) => Course.fromJson(c)).toList() ?? [],
      audit: AuditResult.fromJson(json['audit'] ?? {}),
      result: json['result'] ?? 'UNKNOWN',
    );
  }
}

class HistoryEntry {
  final String endpoint;
  final String user;
  final String timestamp;
  final String status;

  HistoryEntry({required this.endpoint, required this.user, required this.timestamp, required this.status});

  factory HistoryEntry.fromJson(Map<String, dynamic> json) {
    return HistoryEntry(
      endpoint: json['endpoint'] ?? '',
      user: json['user'] ?? '',
      timestamp: json['timestamp'] ?? '',
      status: json['status'] ?? '',
    );
  }
}

class Certificate {
  final String filename;
  final String timestamp;
  final int size;

  Certificate({required this.filename, required this.timestamp, required this.size});

  factory Certificate.fromJson(Map<String, dynamic> json) {
    return Certificate(
      filename: json['filename'] ?? '',
      timestamp: json['timestamp'] ?? '',
      size: json['size'] ?? 0,
    );
  }
}

// API Service
class ApiService {
  static String serverUrl = 'https://nsu-audit-app-8nj0.onrender.com';
  static String? apiKey;
  static final GoogleSignIn _googleSignIn = GoogleSignIn(
    clientId: '757554041588-v0tq8boq638kf46r5n5gla9mp62v5jqg.apps.googleusercontent.com',
    serverClientId: '757554041588-a4romfubu1ev5pstr64eoe2606ore30n.apps.googleusercontent.com',
    scopes: ['email', 'profile'],
  );

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    serverUrl = prefs.getString('serverUrl') ?? 'https://nsu-audit-app-8nj0.onrender.com';
    apiKey = prefs.getString('apiKey');
  }

  static Future<void> loginWithGoogle() async {
    try {
      final GoogleSignInAccount? account;
      try {
        account = await _googleSignIn.signIn();
      } catch (e) {
        throw Exception('Google Sign In not available. Check Google Services configuration.');
      }
      if (account == null) {
        throw Exception('Google sign in cancelled');
      }
      final GoogleSignInAuthentication auth = await account.authentication;
      final response = await http.post(
        Uri.parse('$serverUrl/auth/google'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'access_token': auth.accessToken}),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        apiKey = data['token'];
        final prefs = await SharedPreferences.getInstance();
        if (apiKey != null) {
          await prefs.setString('apiKey', apiKey!);
        }
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['detail'] ?? 'Login failed');
      }
    } catch (e) {
      if (e.toString().contains('Only @northsouth.edu')) {
        throw Exception('Only @northsouth.edu emails are allowed');
      }
      rethrow;
    }
  }

  static Future<void> setServerUrl(String url) async {
    serverUrl = url;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('serverUrl', url);
  }

  static Future<String> generateKey(String name) async {
    final response = await http.post(
      Uri.parse('$serverUrl/generate-key'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name}),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      apiKey = data['apiKey'];
      final prefs = await SharedPreferences.getInstance();
      if (apiKey != null) {
        await prefs.setString('apiKey', apiKey!);
      }
      return apiKey!;
    }
    throw Exception('Failed to generate key');
  }

  static Future<TranscriptResult> processTranscript({String? imageBase64}) async {
    final response = await http.post(
      Uri.parse('$serverUrl/process-transcript'),
      headers: {
        'Content-Type': 'application/json',
        if (apiKey != null) 'x-api-key': apiKey!,
      },
      body: imageBase64 != null
          ? jsonEncode({'image': imageBase64})
          : jsonEncode({}),
    );
    if (response.statusCode == 200) {
      return TranscriptResult.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to process transcript');
  }

  static Future<List<HistoryEntry>> getHistory() async {
    final response = await http.get(
      Uri.parse('$serverUrl/api-history'),
      headers: {
        'Content-Type': 'application/json',
        if (apiKey != null) 'x-api-key': apiKey!,
      },
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['history'] as List<dynamic>?)
          ?.map((h) => HistoryEntry.fromJson(h))
          .toList() ?? [];
    }
    throw Exception('Failed to get history');
  }

  static Future<List<Certificate>> getCertificates() async {
    final response = await http.get(
      Uri.parse('$serverUrl/certificates'),
      headers: {
        'Content-Type': 'application/json',
        if (apiKey != null) 'x-api-key': apiKey!,
      },
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['certificates'] as List<dynamic>?)
          ?.map((c) => Certificate.fromJson(c))
          .toList() ?? [];
    }
    throw Exception('Failed to get certificates');
  }

  static Future<void> logout() async {
    apiKey = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('apiKey');
    try {
      await _googleSignIn.signOut();
    } catch (_) {}
  }
}

// Login Screen
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _serverController = TextEditingController(text: 'http://192.168.0.184:5000');
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _checkExistingSession();
  }

  Future<void> _checkExistingSession() async {
    await ApiService.init();
    if (ApiService.apiKey != null) {
      if (mounted) Navigator.pushReplacementNamed(context, '/home');
    }
    _serverController.text = ApiService.serverUrl;
  }

  Future<void> _handleLogin() async {
    setState(() => _loading = true);
    try {
      await ApiService.setServerUrl(_serverController.text);
      // Skip Google auth for testing - go directly to home
      if (mounted) Navigator.pushReplacementNamed(context, '/home');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
        );
      }
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 72, height: 72,
                decoration: BoxDecoration(
                  color: const Color(0xFF003366),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Center(child: Text('N', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white))),
              ),
              const SizedBox(height: 16),
              const Text('NSU Audit', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
              const Text('Student Audit System', style: TextStyle(color: Colors.grey)),
              const SizedBox(height: 48),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _loading ? null : _handleLogin,
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF003366), padding: const EdgeInsets.all(16)),
                  icon: const Icon(Icons.login, color: Colors.white),
                  label: _loading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Continue', style: TextStyle(fontSize: 16, color: Colors.white)),
                ),
              ),
              const SizedBox(height: 24),
              const Text('Test Mode - No Authentication', style: TextStyle(color: Colors.grey, fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }
}

// Home Screen
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _loading = false;
  String _status = '';

  Future<void> _captureImage() async {
    final picker = ImagePicker();
    final result = await picker.pickImage(source: ImageSource.camera, imageQuality: 80);
    if (result != null) {
      final bytes = await result.readAsBytes();
      final base64 = base64Encode(bytes);
      _processImage(base64);
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final result = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (result != null) {
      final bytes = await result.readAsBytes();
      final base64 = base64Encode(bytes);
      _processImage(base64);
    }
  }

  Future<void> _processImage(base64) async {
    setState(() {
      _loading = true;
      _status = 'Processing image...';
    });
    try {
      _status = 'Sending to server...';
      setState(() {});
      final result = await ApiService.processTranscript(imageBase64: base64);
      _status = 'Got result!';
      if (mounted) Navigator.pushNamed(context, '/result', arguments: result);
    } catch (e) {
      _status = 'Error: ${e.toString()}';
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_status), duration: const Duration(seconds: 5)),
        );
      }
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _loadDemoResult() async {
    setState(() {
      _loading = true;
      _status = 'Loading demo...';
    });
    try {
      final result = await ApiService.processTranscript();
      if (mounted) Navigator.pushNamed(context, '/result', arguments: result);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('NSU Audit'),
        backgroundColor: const Color(0xFF003366),
        foregroundColor: Colors.white,
        actions: [
          IconButton(icon: const Icon(Icons.settings), onPressed: () => Navigator.pushNamed(context, '/settings')),
        ],
      ),
      body: _loading
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [const CircularProgressIndicator(), const SizedBox(height: 16), Text(_status)]))
          : Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Upload your transcript to audit', style: TextStyle(fontSize: 16, color: Colors.grey)),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _captureImage,
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF003366), padding: const EdgeInsets.all(18)),
                      child: const Text('Capture Transcript', style: TextStyle(fontSize: 16)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: _pickImage,
                      style: OutlinedButton.styleFrom(padding: const EdgeInsets.all(18)),
                      child: const Text('Choose from Gallery', style: TextStyle(fontSize: 16, color: Color(0xFF003366))),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: _loadDemoResult,
                      style: OutlinedButton.styleFrom(padding: const EdgeInsets.all(18)),
                      child: const Text('View Demo Result', style: TextStyle(fontSize: 16, color: Colors.orange)),
                    ),
                  ),
                ],
              ),
            ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        selectedItemColor: const Color(0xFF003366),
        onTap: (i) {
          if (i == 0) {}
          if (i == 1) Navigator.pushNamed(context, '/history');
          if (i == 2) Navigator.pushNamed(context, '/certificates');
          if (i == 3) Navigator.pushNamed(context, '/login');
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.history), label: 'History'),
          BottomNavigationBarItem(icon: Icon(Icons.card_membership), label: 'Certificates'),
          BottomNavigationBarItem(icon: Icon(Icons.logout), label: 'Logout'),
        ],
      ),
    );
  }
}

// Result Screen
class ResultScreen extends StatelessWidget {
  const ResultScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final result = ModalRoute.of(context)!.settings.arguments as TranscriptResult;
    final isGraduated = result.result == 'GRADUATED';

    return Scaffold(
      appBar: AppBar(title: const Text('Audit Result'), backgroundColor: const Color(0xFF003366), foregroundColor: Colors.white),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: isGraduated ? Colors.green.shade100 : Colors.red.shade100,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Text(result.result, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: isGraduated ? Colors.green : Colors.red)),
                  const SizedBox(height: 8),
                  Text(result.student.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  Text('ID: ${result.student.id}', style: const TextStyle(color: Colors.grey)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _buildSection('Level 1: Credits', [
              _buildRow('Total Credits', '${result.audit.totalCredits}'),
              _buildRow('Valid Courses', '${result.audit.validCourses}'),
            ]),
            const SizedBox(height: 16),
            _buildSection('Level 2: CGPA', [
              _buildRow('CGPA', '${result.audit.cgpa}'),
              _buildRow('Credits', '${result.audit.credits}'),
              _buildRow('Grade Points', '${result.audit.gradePoints}'),
            ]),
            const SizedBox(height: 16),
            _buildSection('Level 3: Eligibility', [
              _buildRow('Eligible', result.audit.eligible ? 'YES' : 'NO', valueColor: result.audit.eligible ? Colors.green : Colors.red),
              _buildRow('Credit Deficit', '${result.audit.creditDeficit}'),
            ]),
            const SizedBox(height: 16),
            _buildSection('Courses (${result.courses.length})', result.courses.take(10).map((c) => _buildRow(c.code, '${c.grade} (${c.credits})')).toList()),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> rows) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.grey)),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
          child: Column(children: rows),
        ),
      ],
    );
  }

  Widget _buildRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [Text(label, style: const TextStyle(color: Colors.grey)), Text(value, style: TextStyle(fontWeight: FontWeight.w600, color: valueColor))],
      ),
    );
  }
}

// History Screen
class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  List<HistoryEntry> _history = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    try {
      final history = await ApiService.getHistory();
      setState(() => _history = history);
    } catch (e) {
      // ignore
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('History'), backgroundColor: const Color(0xFF003366), foregroundColor: Colors.white),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _history.isEmpty
              ? const Center(child: Text('No history yet'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _history.length,
                  itemBuilder: (c, i) => Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border(left: BorderSide(color: _history[i].status == 'success' ? Colors.green : Colors.red, width: 4)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_history[i].endpoint, style: const TextStyle(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text(_history[i].timestamp.substring(0, 19).replaceAll('T', ' '), style: const TextStyle(fontSize: 12, color: Colors.grey)),
                      ],
                    ),
                  ),
                ),
    );
  }
}

// Certificates Screen
class CertificatesScreen extends StatefulWidget {
  const CertificatesScreen({super.key});

  @override
  State<CertificatesScreen> createState() => _CertificatesScreenState();
}

class _CertificatesScreenState extends State<CertificatesScreen> {
  List<Certificate> _certificates = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadCertificates();
  }

  Future<void> _loadCertificates() async {
    try {
      final certs = await ApiService.getCertificates();
      setState(() => _certificates = certs);
    } catch (e) {
      // ignore
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Certificates'), backgroundColor: const Color(0xFF003366), foregroundColor: Colors.white),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _certificates.isEmpty
              ? const Center(child: Text('No certificates yet'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _certificates.length,
                  itemBuilder: (c, i) => Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                    child: Row(
                      children: [
                        const Text('📜', style: TextStyle(fontSize: 32)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(_certificates[i].filename, style: const TextStyle(fontWeight: FontWeight.w600)),
                              Text(_certificates[i].timestamp.substring(0, 10), style: const TextStyle(fontSize: 12, color: Colors.grey)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
    );
  }
}

// Settings Screen
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  Future<void> _save() async {
    if (mounted) {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings'), backgroundColor: const Color(0xFF003366), foregroundColor: Colors.white),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('App Version', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            const Text('1.0.0', style: TextStyle(color: Colors.grey)),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _save,
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF003366), padding: const EdgeInsets.all(16)),
                child: const Text('Save', style: TextStyle(color: Colors.white)),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async { await ApiService.logout(); if (mounted) Navigator.pushNamedAndRemoveUntil(context, '/login', (r) => false); },
                style: ElevatedButton.styleFrom(backgroundColor: Colors.red.shade100, padding: const EdgeInsets.all(16)),
                child: const Text('Logout', style: TextStyle(color: Colors.red)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}