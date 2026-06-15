from django.db import models
from django.contrib.auth.models import User
from model_utils import FieldTracker


# Create your models here.
class Task(models.Model):
   
    title = models.CharField(max_length=255)
    description = models.TextField()
    project_link = models.URLField()
    due_date = models.DateField(null=True, blank=True)
    task_status = models.CharField(choices=[
        ('pending', 'Pending'),
        ('reviewing', 'Reviewing'),
        ('doing', 'Doing'),
        ('done', 'Done'),
        ('failed', 'Failed')
    ], default='pending', max_length=20)
    priority = models.CharField(choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High')
    ], default='medium', max_length=10)
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_assigned_to')
    assigned_by  = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='task_assigned_by')
    created_at = models.DateTimeField(auto_now_add=True)
    tracker = FieldTracker()

    def __str__(self):
        return f'Task - {self.title}'
    
class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notification')
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    type = models.CharField(max_length=50, default='info')
    created_at = models.DateTimeField(auto_now_add=True)