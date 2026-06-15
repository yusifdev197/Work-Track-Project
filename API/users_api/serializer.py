from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Attendance, Application, Employee

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class EmployeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    profile_image = serializers.ImageField(use_url=True)

    class Meta:
        model = Employee
        fields = [
            'id', 
            'user', 
            'profile_image', 
            'is_manager', 
            'skills',
            'joined_at',
            'phone_number',
            'linkedin_link',
            'git_link'
        ]

class AttendanceSerializer(serializers.ModelSerializer):

    class Meta:
        model = Attendance
        fields = ['id', 'user', 'date', 'check_in', 'check_out', 'late_arrival', 'marked_today']
        read_only_fields = ['user', 'date']

class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = [
            'id', 'first_name', 'last_name',
            'email', 'phone', 'skills',
            'cv', 'project_link', 'about', 
            'status', 'applied_at'
        ]
        read_only_fields = ['status', 'applied_at']