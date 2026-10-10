from django.conf import settings
from django.db import models


class Instance(models.Model):
    """Singleton installation state; configuration expands in later milestones."""

    name = models.CharField(max_length=100)
    domain = models.CharField(max_length=253, blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    installed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
