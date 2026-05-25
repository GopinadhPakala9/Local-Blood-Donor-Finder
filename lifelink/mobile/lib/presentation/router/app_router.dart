import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../screens/auth/splash_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/otp_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/donor/donor_search_screen.dart';
import '../screens/donor/donor_detail_screen.dart';
import '../screens/donor/register_donor_screen.dart';
import '../screens/request/create_request_screen.dart';
import '../screens/request/nearby_requests_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/notifications/notifications_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);
  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isLoading = authState.isLoading;
      if (isLoading) return null;
      final isLoggedIn = authState.value != null;
      final isAuthRoute = state.matchedLocation == '/login' || state.matchedLocation == '/otp';
      if (!isLoggedIn && !isAuthRoute && state.matchedLocation != '/') return '/login';
      if (isLoggedIn && isAuthRoute) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (ctx, _) => const SplashScreen()),
      GoRoute(path: '/login', builder: (ctx, _) => const LoginScreen()),
      GoRoute(
        path: '/otp',
        builder: (ctx, state) => OtpScreen(phone: state.extra as String),
      ),
      ShellRoute(
        builder: (ctx, routerState, child) => HomeScreen(child: child),
        routes: [
          GoRoute(path: '/home', builder: (ctx, _) => const HomeTab()),
          GoRoute(path: '/home/search', builder: (ctx, _) => const DonorSearchScreen()),
          GoRoute(path: '/home/requests', builder: (ctx, _) => const NearbyRequestsScreen()),
          GoRoute(path: '/home/profile', builder: (ctx, _) => const ProfileScreen()),
        ],
      ),
      GoRoute(
        path: '/donor/:id',
        builder: (ctx, state) => DonorDetailScreen(donorId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/create-request', builder: (ctx, _) => const CreateRequestScreen()),
      GoRoute(path: '/register-donor', builder: (ctx, _) => const RegisterDonorScreen()),
      GoRoute(path: '/notifications', builder: (ctx, _) => const NotificationsScreen()),
    ],
  );
});
