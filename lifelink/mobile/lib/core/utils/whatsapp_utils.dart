import 'package:url_launcher/url_launcher.dart';

class WhatsAppUtils {
  static Future<void> openWhatsApp(String phone, String message) async {
    final cleaned = phone.replaceAll(RegExp(r'[^\d+]'), '');
    final encoded = Uri.encodeComponent(message);
    final uri = Uri.parse('https://wa.me/$cleaned?text=$encoded');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  static Future<void> makeCall(String phone) async {
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  static String donorRequestMessage(String bloodGroup, String hospitalName) =>
      'Hi, I saw you are a $bloodGroup blood donor on LifeLink. '
      '$hospitalName urgently needs $bloodGroup blood. '
      'Can you please help? Thank you!';
}
