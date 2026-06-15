from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Task, Notification


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class TaskSerializer(serializers.ModelSerializer):
    assigned_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='assigned_to', write_only=True
    )

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'project_link',
            'due_date', 'task_status', 'priority', 'assigned_to',
            'assigned_by', 'assigned_to_id', 'created_at'
        ]
        read_only_fields = ['assigned_by', 'created_at']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'is_read', 'created_at', 'type']
        read_only_fields = ['message', 'created_at', 'type'] 