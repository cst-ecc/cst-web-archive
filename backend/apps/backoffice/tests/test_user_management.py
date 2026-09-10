import re

from django.contrib.auth.models import Group
from django.core import mail
from django.test import TestCase, override_settings
from django.urls import reverse

from apps.accounts.models import User
from apps.backoffice.session import VERIFIED_USER_ID


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
)
class BackofficeUserManagementTests(TestCase):
    def setUp(self):
        self.manager_group = Group.objects.get(name="Manager")
        self.editor_group = Group.objects.get(name="Éditeur")

        self.superadmin = User.objects.create_superuser(
            email="root@example.test",
            password="StrongPassword-123!",
        )

        self.manager = User.objects.create_user(
            email="manager@example.test",
            password="StrongPassword-123!",
        )
        self.manager.groups.add(self.manager_group)

    def _force_verified_login(self, user):
        self.client.force_login(user)
        session = self.client.session
        session[VERIFIED_USER_ID] = user.pk
        session.save()

    def test_only_superadmin_can_open_user_list(self):
        self._force_verified_login(self.manager)
        response = self.client.get(reverse("backoffice:user_list"))
        self.assertRedirects(response, reverse("backoffice:dashboard"))

    def test_superadmin_can_create_editor_without_setting_password(self):
        self._force_verified_login(self.superadmin)

        response = self.client.post(
            reverse("backoffice:user_create"),
            {
                "email": "editor@example.test",
                "first_name": "Jeanne",
                "last_name": "Doe",
                "role": "Éditeur",
                "is_active": "on",
            },
        )

        self.assertRedirects(response, reverse("backoffice:user_list"))

        user = User.objects.get(email="editor@example.test")
        self.assertFalse(user.has_usable_password())
        self.assertTrue(user.groups.filter(name="Éditeur").exists())
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(len(mail.outbox[0].alternatives), 1)

    def test_invitation_allows_password_setup_once(self):
        self._force_verified_login(self.superadmin)
        self.client.post(
            reverse("backoffice:user_create"),
            {
                "email": "newuser@example.test",
                "first_name": "Paul",
                "last_name": "Doe",
                "role": "Manager",
                "is_active": "on",
            },
        )

        self.client.logout()
        body = mail.outbox[0].body
        match = re.search(r"https?://[^\s]+/backoffice/setup/[^\s]+", body)
        self.assertIsNotNone(match)
        setup_url = match.group(0)

        response = self.client.get(setup_url)
        self.assertEqual(response.status_code, 200)

        response = self.client.post(
            setup_url,
            {
                "new_password1": "NewStrongPassword-456!",
                "new_password2": "NewStrongPassword-456!",
            },
        )
        self.assertRedirects(response, reverse("backoffice:login"))

        user = User.objects.get(email="newuser@example.test")
        self.assertTrue(user.check_password("NewStrongPassword-456!"))

        # Le token doit devenir invalide après changement du mot de passe.
        response = self.client.get(setup_url)
        self.assertEqual(response.status_code, 400)

    def test_superuser_is_not_exposed_in_managed_user_list(self):
        self._force_verified_login(self.superadmin)
        response = self.client.get(reverse("backoffice:user_list"))
        self.assertNotContains(response, self.superadmin.email)
