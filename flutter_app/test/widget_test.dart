import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:nsu_audit/main.dart';

void main() {
  testWidgets('App loads login screen', (WidgetTester tester) async {
    await tester.pumpWidget(const NSUAuditApp());
    await tester.pumpAndSettle();

    expect(find.text('NSU Audit'), findsOneWidget);
    expect(find.text('Continue'), findsOneWidget);
  });
}