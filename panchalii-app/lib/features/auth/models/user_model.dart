class UserModel {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String role;
  final bool isVerified;
  final bool hasPassword;
  final DateTime? createdAt;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.role,
    required this.isVerified,
    this.hasPassword = true,
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
    id: json['_id'] as String,
    name: json['name'] as String,
    email: json['email'] as String,
    phone: json['phone'] as String?,
    role: json['role'] as String? ?? 'user',
    isVerified: json['isVerified'] as bool? ?? false,
    hasPassword: json['hasPassword'] as bool? ?? true,
    createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '')?.toLocal(),
  );
}
