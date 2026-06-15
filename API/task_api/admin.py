from django.contrib import admin
from .models import Task, Notification

# Register your models here.
admin.site.register(Task)
admin.site.register(Notification)
