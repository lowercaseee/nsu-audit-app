import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:image_picker/image_picker.dart';

void main() {
  runApp(const NSUAuditApp());
}

class NSUAuditApp extends StatelessWidget {
  const NSUAuditApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NSU Audit',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.dark,
      theme: _darkTheme,
      darkTheme: _darkTheme,
      routes: _routes,
      home: const SplashScreen(),
    );
  }

  static final _darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: ColorScheme.dark(
      primary: const Color(0xFF00D4FF),
      secondary: const Color(0xFF7B61FF),
      surface: const Color(0xFF1A1A2E),
      background: const Color(0xFF0F0F1A),
    ),
    scaffoldBackgroundColor: const Color(0xFF0F0F1A),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      centerTitle: true,
    ),
    cardTheme: CardThemeData(
      color: const Color(0xFF1A1A2E),
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFF00D4FF),
        foregroundColor: Colors.black,
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFF1A1A2E),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF00D4FF), width: 2),
      ),
    ),
  );

  static final _routes = {
    '/login': (ctx) => const LoginScreen(),
    '/home': (ctx) => const HomeScreen(),
    '/result': (ctx) => const ResultScreen(),
    '/history': (ctx) => const HistoryScreen(),
    '/certificates': (ctx) => const CertificatesScreen(),
    '/settings': (ctx) => const SettingsScreen(),
  };
}

class ApiService {
  static String serverUrl = 'https://nsu-audit-app-8nj0.onrender.com';

  static Future<dynamic> loginWithGoogle() async {
    await Future.delayed(const Duration(seconds: 1));
    return {'token': 'test-token', 'user': {'name': 'Test User'}};
  }

  static Future<dynamic> processTranscript({String? imageBase64}) async {
    final body = imageBase64 != null ? jsonEncode({'image': imageBase64}) : '{}';
    final response = await http.post(
      Uri.parse('$serverUrl/process-transcript'),
      headers: {'Content-Type': 'application/json'},
      body: body,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to process transcript');
  }

  static Future<List<dynamic>> getHistory() async {
    final response = await http.get(
      Uri.parse('$serverUrl/api-history'),
      headers: {'Content-Type': 'application/json'},
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body)['history'] ?? [];
    }
    return [];
  }

  static Future<List<dynamic>> getCertificates() async {
    final response = await http.get(
      Uri.parse('$serverUrl/certificates'),
      headers: {'Content-Type': 'application/json'},
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body)['certificates'] ?? [];
    }
    return [];
  }
}

class Student {
  final String name;
  final String id;
  final String degree;
  Student({required this.name, required this.id, required this.degree});
  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      name: json['name'] ?? 'Student',
      id: json['id'] ?? '000000',
      degree: json['degree'] ?? 'BBA',
    );
  }
}

class Course {
  final String code;
  final String grade;
  final double credits;
  Course({required this.code, required this.grade, required this.credits});
  factory Course.fromJson(Map<String, dynamic> json) {
    return Course(
      code: json['code'] ?? '',
      grade: json['grade'] ?? 'F',
      credits: (json['credits'] ?? 3).toDouble(),
    );
  }
}

class HistoryEntry {
  final String endpoint;
  final String user;
  final String timestamp;
  final bool status;
  HistoryEntry({required this.endpoint, required this.user, required this.timestamp, required this.status});
  factory HistoryEntry.fromJson(Map<String, dynamic> json) {
    return HistoryEntry(
      endpoint: json['endpoint'] ?? '',
      user: json['user'] ?? '',
      timestamp: json['timestamp'] ?? '',
      status: json['status'] ?? false,
    );
  }
}

class Certificate {
  final String filename;
  final String timestamp;
  Certificate({required this.filename, required this.timestamp});
  factory Certificate.fromJson(Map<String, dynamic> json) {
    return Certificate(
      filename: json['filename'] ?? '',
      timestamp: json['timestamp'] ?? '',
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(duration: const Duration(seconds: 2), vsync: this);
    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(_controller);
    _scaleAnimation = Tween<double>(begin: 0.5, end: 1).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutBack));
    _controller.forward();
    _navigateToLogin();
  }

  void _navigateToLogin() async {
    await Future.delayed(const Duration(seconds: 3));
    if (mounted) Navigator.pushReplacementNamed(context, '/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return Opacity(
              opacity: _fadeAnimation.value,
              child: Transform.scale(
                scale: _scaleAnimation.value,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 120, height: 120,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [Color(0xFF00D4FF), Color(0xFF7B61FF)]),
                        borderRadius: BorderRadius.circular(30),
                        boxShadow: [BoxShadow(color: const Color(0xFF00D4FF).withOpacity(0.5), blurRadius: 30, spreadRadius: 5)],
                      ),
                      child: const Icon(Icons.school, size: 60, color: Colors.white),
                    ),
                    const SizedBox(height: 24),
                    const Text('NSU AUDIT', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 4, color: Colors.white)),
                    const SizedBox(height: 8),
                    ShaderMask(
                      shaderCallback: (bounds) => const LinearGradient(colors: [Color(0xFF00D4FF), Color(0xFF7B61FF)]).createShader(bounds),
                      child: const Text('Student Audit System', style: TextStyle(fontSize: 14, color: Colors.white)),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80, height: 80,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF00D4FF), Color(0xFF7B61FF)]),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(Icons.school, size: 40, color: Colors.white),
              ),
              const SizedBox(height: 32),
              const Text('Welcome Back', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text('Sign in to access your academic records', style: TextStyle(color: Colors.grey)),
              const SizedBox(height: 48),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    await ApiService.loginWithGoogle();
                    if (context.mounted) Navigator.pushReplacementNamed(context, '/home');
                  },
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.g_mobiledata, size: 28),
                      SizedBox(width: 12),
                      Text('Continue with Google'),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () async {
                    await ApiService.loginWithGoogle();
                    if (context.mounted) Navigator.pushReplacementNamed(context, '/home');
                  },
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFF00D4FF)),
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                  ),
                  child: const Text('Continue as Guest', style: TextStyle(color: Color(0xFF00D4FF))),
                ),
              ),
              const SizedBox(height: 32),
              const Text('Only @northsouth.edu emails allowed', style: TextStyle(color: Colors.grey, fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _loading = false;
  String _status = '';
  final _urlController = TextEditingController();

  Future<void> _takePhoto() async {
    try {
      final picker = ImagePicker();
      final result = await picker.pickImage(source: ImageSource.camera, imageQuality: 80);
      if (result != null) {
        final bytes = await result.readAsBytes();
        final base64 = base64Encode(bytes);
        _process(base64);
      }
    } catch (e) {
      setState(() { _status = 'Error: ${e.toString()}'; });
    }
  }

  Future<void> _pickImage() async {
    try {
      final picker = ImagePicker();
      final result = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
      if (result != null) {
        final bytes = await result.readAsBytes();
        final base64 = base64Encode(bytes);
        _process(base64);
      }
    } catch (e) {
      setState(() { _status = 'Error: ${e.toString()}'; });
    }
  }

  Future<void> _uploadFromUrl() async {
    final url = _urlController.text.trim();
    if (url.isEmpty) {
      setState(() { _status = 'Please enter an image URL'; });
      return;
    }
    setState(() { _loading = true; _status = 'Fetching image...'; });
    try {
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final base64 = base64Encode(response.bodyBytes);
        _process(base64);
      } else {
        setState(() { _status = 'Failed to fetch image'; _loading = false; });
      }
    } catch (e) {
      setState(() { _status = 'Error: ${e.toString()}'; _loading = false; });
    }
  }

  Future<void> _loadDemo() async {
    setState(() { _loading = true; _status = 'Loading demo...'; });
    try {
      final result = await ApiService.processTranscript();
      if (mounted) Navigator.pushNamed(context, '/result', arguments: result);
    } catch (e) {
      setState(() { _status = 'Error: ${e.toString()}'; });
    }
    setState(() { _loading = false; });
  }

  Future<void> _process(String base64) async {
    setState(() { _loading = true; _status = 'Processing...'; });
    try {
      final result = await ApiService.processTranscript(imageBase64: base64);
      if (mounted) Navigator.pushNamed(context, '/result', arguments: result);
    } catch (e) {
      setState(() { _status = 'Error: ${e.toString()}'; });
    }
    setState(() { _loading = false; });
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('NSU AUDIT', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 2)),
        actions: [
          IconButton(icon: const Icon(Icons.history), onPressed: () => Navigator.pushNamed(context, '/history')),
          IconButton(icon: const Icon(Icons.card_membership), onPressed: () => Navigator.pushNamed(context, '/certificates')),
        ],
      ),
      body: _loading 
        ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const CircularProgressIndicator(color: Color(0xFF00D4FF)), const SizedBox(height: 16), Text(_status, style: const TextStyle(color: Colors.grey))]))
        : Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                _buildFeatureCard(Icons.camera_alt, 'Capture Transcript', 'Take photo of your transcript', _takePhoto),
                const SizedBox(height: 16),
                _buildFeatureCard(Icons.photo_library, 'Choose from Gallery', 'Select an image from gallery', _pickImage),
                const SizedBox(height: 16),
                _buildFeatureCard(Icons.link, 'Upload via URL', 'Enter image URL to process', _uploadFromUrl),
                const SizedBox(height: 16),
                _buildFeatureCard(Icons.preview, 'View Demo Result', 'See sample audit result', _loadDemo),
              ],
            ),
          ),
    );
  }

  Widget _buildFeatureCard(IconData icon, String title, String subtitle, VoidCallback onTap) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Container(
                width: 56, height: 56,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF00D4FF), Color(0xFF7B61FF)]),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: Colors.white),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    Text(subtitle, style: const TextStyle(color: Colors.grey)),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}

class ResultScreen extends StatelessWidget {
  const ResultScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final result = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final student = result?['student'] ?? {};
    final audit = result?['audit'] ?? {};
    final courses = result?['courses'] as List<dynamic>? ?? [];

    return Scaffold(
      appBar: AppBar(title: const Text('Audit Result')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildInfoCard('Student', student['name'] ?? 'N/A', Icons.person),
            const SizedBox(height: 16),
            _buildInfoCard('ID', student['id'] ?? 'N/A', Icons.badge),
            const SizedBox(height: 16),
            _buildInfoCard('Degree', student['degree'] ?? 'N/A', Icons.school),
            const SizedBox(height: 24),
            const Text('Performance', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _buildStatCard('CGPA', audit['level2']?['cgpa']?.toString() ?? '0.0', Colors.green)),
                const SizedBox(width: 16),
                Expanded(child: _buildStatCard('Credits', audit['level2']?['credits']?.toString() ?? '0', Colors.blue)),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _buildStatCard('Status', audit['level3']?['eligible'] == true ? 'Eligible' : 'Not Eligible', audit['level3']?['eligible'] == true ? Colors.green : Colors.red)),
              ],
            ),
            const SizedBox(height: 24),
            Text('Courses (${courses.length})', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            if (courses.isEmpty)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('No courses found', style: TextStyle(color: Colors.grey)),
                ),
              )
            else
              ...courses.map((course) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _buildCourseCard(course),
              )),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard(String label, String value, IconData icon) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(icon, color: const Color(0xFF00D4FF)),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Text(value, style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: color)),
            Text(label, style: const TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Widget _buildCourseCard(Map<String, dynamic> course) {
    final gradeColor = _getGradeColor(course['grade'] ?? 'F');
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              width: 50, height: 50,
              decoration: BoxDecoration(
                color: gradeColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Center(
                child: Text(course['grade'] ?? 'F', style: TextStyle(fontWeight: FontWeight.bold, color: gradeColor, fontSize: 16)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(course['code'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  Text(course['semester'] ?? 'Unknown', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                ],
              ),
            ),
            Text('${course['credits'] ?? 3} cr', style: const TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Color _getGradeColor(String grade) {
    switch (grade) {
      case 'A+':
      case 'A':
      case 'A-':
        return Colors.green;
      case 'B+':
      case 'B':
      case 'B-':
        return Colors.blue;
      case 'C+':
      case 'C':
        return Colors.orange;
      default:
        return Colors.red;
    }
  }
}

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  List<dynamic> _history = [];

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    final history = await ApiService.getHistory();
    setState(() => _history = history);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('History')),
      body: _history.isEmpty 
        ? const Center(child: Text('No history yet', style: TextStyle(color: Colors.grey)))
        : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _history.length,
            itemBuilder: (ctx, i) {
              final item = _history[i];
              return Card(
                child: ListTile(
                  leading: Icon(item['status'] == true ? Icons.check_circle : Icons.cancel, color: item['status'] == true ? Colors.green : Colors.red),
                  title: Text(item['endpoint'] ?? ''),
                  subtitle: Text(item['timestamp'] ?? ''),
                ),
              );
            },
          ),
    );
  }
}

class CertificatesScreen extends StatefulWidget {
  const CertificatesScreen({super.key});

  @override
  State<CertificatesScreen> createState() => _CertificatesScreenState();
}

class _CertificatesScreenState extends State<CertificatesScreen> {
  List<dynamic> _certs = [];

  @override
  void initState() {
    super.initState();
    _loadCertificates();
  }

  Future<void> _loadCertificates() async {
    final certs = await ApiService.getCertificates();
    setState(() => _certs = certs);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Certificates')),
      body: _certs.isEmpty 
        ? const Center(child: Text('No certificates yet', style: TextStyle(color: Colors.grey)))
        : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _certs.length,
            itemBuilder: (ctx, i) {
              final cert = _certs[i];
              return Card(
                child: ListTile(
                  leading: const Icon(Icons.picture_as_pdf, color: Colors.red),
                  title: Text(cert['filename'] ?? 'Certificate'),
                  subtitle: Text(cert['timestamp'] ?? ''),
                  trailing: const Icon(Icons.download),
                ),
              );
            },
          ),
    );
  }
}

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: const Center(child: Text('Version 1.0.0', style: TextStyle(color: Colors.grey))),
    );
  }
}