from django.urls import include, path
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({'status': 'ok'})


urlpatterns = [
    path('api/health/', HealthView.as_view()),
    path('api/setup/', include('core.urls')),
]
