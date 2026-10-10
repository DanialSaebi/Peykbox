import hmac
from django.contrib.auth import get_user_model
from django.db import connection, transaction
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Instance
from .serializers import InstallationSerializer
from django.conf import settings


class SetupStatusView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        instance = Instance.objects.first()
        return Response({
            'installed': instance is not None,
            'name': instance.name if instance else None,
        })


class SetupCompleteView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = 'setup'

    def post(self, request):
        if Instance.objects.exists():
            return Response({'detail': 'Setup has already been completed.'}, status=status.HTTP_409_CONFLICT)

        serializer = InstallationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        expected = (settings.SECRET_DIR / 'setup_token').read_text(encoding='utf-8').strip()
        if not hmac.compare_digest(data['setup_token'], expected):
            return Response({'detail': 'Invalid installation key.'}, status=status.HTTP_403_FORBIDDEN)

        # PostgreSQL transaction-level advisory lock blocks concurrent first-setup attempts.
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute('SELECT pg_advisory_xact_lock(%s)', [982348120])
            if Instance.objects.exists():
                return Response({'detail': 'Setup has already been completed.'}, status=status.HTTP_409_CONFLICT)

            user_model = get_user_model()
            owner = user_model.objects.create_user(
                username=data['owner_email'],
                email=data['owner_email'],
                password=data['owner_password'],
                first_name=data['owner_name'],
            )
            Instance.objects.create(
                name=data['instance_name'],
                domain=data.get('domain', ''),
                owner=owner,
            )
        return Response({'installed': True, 'name': data['instance_name']}, status=status.HTTP_201_CREATED)
