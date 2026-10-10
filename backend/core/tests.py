from unittest.mock import patch
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from .models import Instance


class SetupTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.payload = {
            'setup_token': 'sample-install-key',
            'owner_name': 'Project Owner',
            'owner_email': 'owner@example.com',
            'owner_password': 'A-very-strong-unique-password-5287!',
            'instance_name': 'My Peykbox',
            'domain': 'mail.example.com',
        }

    def test_setup_lifecycle(self):
        self.assertEqual(self.client.get('/api/setup/status/').data['installed'], False)
        with patch('core.views.hmac.compare_digest', return_value=True):
            response = self.client.post('/api/setup/complete/', self.payload, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Instance.objects.count(), 1)
        self.assertEqual(self.client.get('/api/setup/status/').data['installed'], True)
        self.assertEqual(self.client.post('/api/setup/complete/', self.payload, format='json').status_code, 409)

    def test_invalid_key_is_rejected(self):
        with patch('core.views.hmac.compare_digest', return_value=False):
            response = self.client.post('/api/setup/complete/', self.payload, format='json')
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Instance.objects.exists())
