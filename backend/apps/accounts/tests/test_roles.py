from django.contrib.auth.models import Group
from django.test import TestCase


class BackofficeRoleMigrationTests(TestCase):
    def test_default_backoffice_groups_exist(self):
        self.assertTrue(Group.objects.filter(name="Manager").exists())
        self.assertTrue(Group.objects.filter(name="Éditeur").exists())
