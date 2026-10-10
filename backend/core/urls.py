from django.urls import path
from .views import SetupCompleteView, SetupStatusView

urlpatterns = [
    path('status/', SetupStatusView.as_view(), name='setup-status'),
    path('complete/', SetupCompleteView.as_view(), name='setup-complete'),
]
