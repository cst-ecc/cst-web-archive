from django.test import TestCase

from apps.accounts.models import User


class UserModelTests(TestCase):
    def test_email_is_login_identifier(self):
        user = User.objects.create_user(
            email="test@example.com",
            password="StrongPassword123!",
        )

        self.assertEqual(User.USERNAME_FIELD, "email")
        self.assertEqual(user.email, "test@example.com")

        field_names = {
            field.name
            for field in User._meta.get_fields()
        }

        self.assertNotIn("username", field_names)
        self.assertIn("email", field_names)
        self.assertTrue(User._meta.get_field("email").unique)