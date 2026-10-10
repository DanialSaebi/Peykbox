import re
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers


DOMAIN_PATTERN = re.compile(r'^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$')


class InstallationSerializer(serializers.Serializer):
    setup_token = serializers.CharField(max_length=200, trim_whitespace=True)
    owner_name = serializers.CharField(max_length=100)
    owner_email = serializers.EmailField(max_length=150)
    owner_password = serializers.CharField(min_length=12, max_length=128, write_only=True, trim_whitespace=False)
    instance_name = serializers.CharField(max_length=100)
    domain = serializers.CharField(max_length=253, required=False, allow_blank=True)

    def validate_owner_password(self, value):
        validate_password(value)
        return value

    def validate_domain(self, value):
        value = value.strip().lower()
        if value and not DOMAIN_PATTERN.fullmatch(value):
            raise serializers.ValidationError('Provide a domain such as mail.example.com, or leave it blank.')
        return value

    def validate_owner_email(self, value):
        return value.strip().lower()
