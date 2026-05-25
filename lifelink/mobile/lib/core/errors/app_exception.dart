sealed class AppException implements Exception {
  final String message;
  final int? code;
  const AppException(this.message, {this.code});
}

class NetworkException extends AppException {
  const NetworkException(super.message, {super.code});
}

class ServerException extends AppException {
  const ServerException(super.message, {super.code});
}

class AuthException extends AppException {
  const AuthException(super.message, {super.code});
}

class ValidationException extends AppException {
  final Map<String, String>? errors;
  const ValidationException(super.message, {super.code, this.errors});
}

class UnknownException extends AppException {
  const UnknownException(super.message, {super.code});
}

class NotFoundException extends AppException {
  const NotFoundException(super.message, {super.code});
}
