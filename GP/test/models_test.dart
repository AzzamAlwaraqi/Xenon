import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gp/models/booking_model.dart';
import 'package:gp/models/notification_model.dart';
import 'package:gp/models/package_model.dart';
import 'package:gp/models/review_model.dart';
import 'package:gp/models/user_model.dart';

/// Model parsing tests.
///
/// Every model here is fed the shape the Xenon backend actually returns, so a
/// change to an API field name fails here rather than rendering a blank screen
/// on a phone.
void main() {
  group('BookingModel', () {
    test('parses a populated booking from the API', () {
      final booking = BookingModel.fromJson({
        '_id': 'booking-1',
        'status': 'accepted',
        'booking_date': '2026-09-20T00:00:00.000Z',
        'number_of_people': 3,
        'package_id': {'package_name': 'Petra Day Tour', 'package_price': 120},
        'user_id': {'name': 'Rana Odeh'},
        'vendor_id': {'company_name': 'Petra Tours'},
      });

      expect(booking.id, 'booking-1');
      expect(booking.title, 'Petra Day Tour');
      expect(booking.status, 'accepted');
      expect(booking.guests, 3);
      expect(booking.price, 120.0);
      expect(booking.user?['name'], 'Rana Odeh');
      expect(booking.vendor?['company_name'], 'Petra Tours');
    });

    test('maps every accepted status onto the success colour and icon', () {
      for (final status in ['accepted', 'completed', 'confirmed', 'ACCEPTED']) {
        final booking = BookingModel.fromJson({'status': status});
        expect(booking.statusColor, Colors.green, reason: 'status: $status');
        expect(booking.icon, Icons.check_circle, reason: 'status: $status');
      }
    });

    test('maps rejection and cancellation onto the failure colour', () {
      for (final status in ['cancelled', 'rejected']) {
        final booking = BookingModel.fromJson({'status': status});
        expect(booking.statusColor, Colors.red, reason: 'status: $status');
        expect(booking.icon, Icons.cancel, reason: 'status: $status');
      }
    });

    test('falls back to the pending styling for an unknown status', () {
      final booking = BookingModel.fromJson({'status': 'something-new'});
      expect(booking.statusColor, Colors.orange);
      expect(booking.icon, Icons.access_time);
    });

    test('defaults a booking with no status at all to pending', () {
      final booking = BookingModel.fromJson({});
      expect(booking.status, 'pending');
      expect(booking.statusColor, Colors.orange);
      expect(booking.guests, 1);
      expect(booking.price, 0.0);
    });

    test('never renders a null package name', () {
      expect(BookingModel.fromJson({}).title, 'Unknown Package');
    });

    test('accepts an unpopulated package reference without crashing', () {
      final booking = BookingModel.fromJson({
        '_id': 'b1',
        'package_id': '01a01ff1-2de8-7bf9-95c2-8b0d46cc28f5',
        'total_price': 75,
      });
      expect(booking.package, isNull);
      expect(booking.title, 'Unknown Package');
      expect(booking.price, 75.0);
    });

    test('reads a price supplied as a string', () {
      final booking = BookingModel.fromJson({
        'package': {'package_price': '99.5'},
      });
      expect(booking.price, 99.5);
    });

    test('prefers the package price over the booking total', () {
      final booking = BookingModel.fromJson({
        'package': {'price': 40},
        'total_price': 400,
      });
      expect(booking.price, 40.0);
    });

    test('accepts either id field the API may return', () {
      expect(BookingModel.fromJson({'_id': 'a'}).id, 'a');
      expect(BookingModel.fromJson({'id': 'b'}).id, 'b');
      expect(BookingModel.fromJson({}).id, '');
    });

    test('falls back through the date fields the API may send', () {
      expect(BookingModel.fromJson({'booking_date': '2026-01-01'}).date, '2026-01-01');
      expect(BookingModel.fromJson({'date': '2026-02-02'}).date, '2026-02-02');
      expect(BookingModel.fromJson({'createdAt': '2026-03-03'}).date, '2026-03-03');
      expect(BookingModel.fromJson({}).date, '');
    });

    test('KNOWN DEFECT XEN-D14: the app styles "confirmed", a status the backend domain rejects', () {
      // backend/src/utils/checkvalidete.js allows only pending, accepted,
      // rejected, completed, cancelled. The app renders "confirmed" as success,
      // so the two vocabularies have drifted apart.
      final booking = BookingModel.fromJson({'status': 'confirmed'});
      expect(booking.statusColor, Colors.green);
    });
  });

  group('PackageModel', () {
    test('parses the backend package shape', () {
      final package = PackageModel.fromJson({
        '_id': 'package-1',
        'package_name': 'Wadi Rum Overnight',
        'package_description': 'Desert camp under the stars',
        'package_price': 180,
        'ratingsAverage': 4.5,
        'ratingsQuantity': 12,
      });

      expect(package.id, 'package-1');
      expect(package.title, 'Wadi Rum Overnight');
      expect(package.description, 'Desert camp under the stars');
      expect(package.price, 180.0);
      expect(package.ratingsAverage, 4.5);
      expect(package.ratingsQuantity, 12);
    });

    test('reads a price supplied as a formatted string', () {
      expect(PackageModel.fromJson({'package_price': '250.75'}).price, 250.75);
      expect(PackageModel.fromJson({'package_price': 'JOD 250'}).price, 250.0);
    });

    test('falls back to zero for an unparseable price rather than crashing', () {
      expect(PackageModel.fromJson({'package_price': 'free'}).price, 0.0);
      expect(PackageModel.fromJson({}).price, 0.0);
    });

    test('reads the cover image from a Cloudinary images array', () {
      final package = PackageModel.fromJson({
        'images': [
          {'url': 'https://res.cloudinary.com/xenon/a.webp'},
          {'url': 'https://res.cloudinary.com/xenon/b.webp'},
        ],
      });
      expect(package.image, 'https://res.cloudinary.com/xenon/a.webp');
    });

    test('falls back to a plain image field', () {
      expect(PackageModel.fromJson({'image': 'cover.jpg'}).image, 'cover.jpg');
    });

    test('shows placeholder copy rather than null for missing text', () {
      final package = PackageModel.fromJson({});
      expect(package.title, 'Unknown Package');
      expect(package.description, 'No description available');
    });

    test('reads the vendor id from a populated vendor object', () {
      final package = PackageModel.fromJson({
        'vendor_id': {'_id': '01a01ff1-2de8-7bf9-95c2-8b0d46cc28f5'},
      });
      expect(package.vendorId, '01a01ff1-2de8-7bf9-95c2-8b0d46cc28f5');
    });

    test('reads the vendor id when it is an unpopulated string', () {
      final package = PackageModel.fromJson({'vendor_id': '01a01ff1-2de8-7bf9-95c2-8b0d46cc28f5'});
      expect(package.vendorId, '01a01ff1-2de8-7bf9-95c2-8b0d46cc28f5');
    });

    test('KNOWN DEFECT XEN-D22: a package with no vendor is given a hardcoded vendor id', () {
      // The fallback UUID is a specific real vendor. A booking created from such
      // a package is attributed to the wrong business.
      const hardcoded = '01a03b26-fe68-7b94-91c3-291b787e1d9f';
      expect(PackageModel.fromJson({}).vendorId, hardcoded);
      expect(PackageModel.fromJson({'vendor_id': {}}).vendorId, hardcoded);
    });
  });

  group('ReviewModel', () {
    test('parses the backend review shape', () {
      final review = ReviewModel.fromJson({
        '_id': 'review-1',
        'review_text': 'Excellent guide.',
        'review_rating': 5,
        'user_id': {'name': 'Rana Odeh'},
        'package_id': {'package_name': 'Petra Day Tour'},
        'createdAt': '2026-08-01T10:00:00.000Z',
      });

      expect(review.id, 'review-1');
      expect(review.review, 'Excellent guide.');
      expect(review.rating, 5.0);
      expect(review.user, 'Rana Odeh');
      expect(review.package, 'Petra Day Tour');
      expect(review.createdAt?.year, 2026);
    });

    test('defaults a missing rating to zero rather than throwing', () {
      expect(ReviewModel.fromJson({}).rating, 0.0);
      expect(ReviewModel.fromJson({}).review, '');
    });

    test('leaves the timestamp null when it is missing or unparseable', () {
      expect(ReviewModel.fromJson({}).createdAt, isNull);
      expect(ReviewModel.fromJson({'createdAt': 'not-a-date'}).createdAt, isNull);
    });

    test('reads an unpopulated user reference as a plain value', () {
      expect(ReviewModel.fromJson({'user': 'Rana'}).user, 'Rana');
    });
  });

  group('UserModel', () {
    test('parses a user and defaults the role to tourist', () {
      final user = UserModel.fromJson({'_id': 'u1', 'name': 'Rana', 'email': 'rana@example.com'});
      expect(user.id, 'u1');
      expect(user.role, 'user');
    });

    test('round-trips through toJson without losing a field', () {
      final source = {
        '_id': 'u1',
        'name': 'Rana',
        'email': 'rana@example.com',
        'phone': '0791234567',
        'role': 'user',
        'profileImage': 'https://cdn/a.jpg',
        'isVerified': true,
      };
      expect(UserModel.fromJson(source).toJson(), source);
    });

    test('never carries a password field, even when the API sends one', () {
      final json = UserModel.fromJson({
        '_id': 'u1', 'name': 'Rana', 'email': 'rana@example.com', 'password': 'leaked',
      }).toJson();
      expect(json.containsKey('password'), isFalse);
      expect(json.values.contains('leaked'), isFalse);
    });

    test('renders empty strings rather than null for missing text', () {
      final user = UserModel.fromJson({});
      expect(user.id, '');
      expect(user.name, '');
      expect(user.email, '');
    });
  });

  group('NotificationModel', () {
    test('parses a notification that uses the app-side field names', () {
      final notification = NotificationModel.fromJson({
        '_id': 'n1',
        'title': 'Booking accepted',
        'message': 'Your Petra booking was accepted.',
        'isRead': true,
        'createdAt': '2026-08-01T10:00:00.000Z',
      });

      expect(notification.id, 'n1');
      expect(notification.title, 'Booking accepted');
      expect(notification.message, 'Your Petra booking was accepted.');
      expect(notification.isRead, isTrue);
      expect(notification.createdAt?.month, 8);
    });

    test('KNOWN DEFECT XEN-D23: the backend notification payload parses to an empty notification', () {
      // backend/src/Models/NotificationModel.js stores notification_message and
      // is_read. The app reads message and isRead, so a real notification shows
      // an empty body and always appears unread.
      final notification = NotificationModel.fromJson({
        '_id': 'n1',
        'title': 'Booking accepted',
        'notification_message': 'Your Petra booking was accepted.',
        'is_read': true,
        'notification_type': 'booking_update',
      });

      expect(notification.title, 'Booking accepted', reason: 'title happens to match on both sides');
      expect(notification.message, '', reason: 'notification_message is never read');
      expect(notification.isRead, isFalse, reason: 'is_read is never read, so it always looks unread');
    });

    test('defaults a notification with no fields to a safe empty state', () {
      final notification = NotificationModel.fromJson({});
      expect(notification.id, '');
      expect(notification.title, '');
      expect(notification.message, '');
      expect(notification.isRead, isFalse);
      expect(notification.createdAt, isNull);
    });
  });
}
