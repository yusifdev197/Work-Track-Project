from django.db import models
from django.contrib.auth.models import User
from PIL import Image
from django.utils import timezone
from model_utils import FieldTracker



# Create your models here.
class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    profile_image = models.ImageField(upload_to='profile_pics/', default='profile_pics/default.jpg')
    phone_number = models.CharField(max_length=20)
    is_manager = models.BooleanField(default=False)
    skills = models.TextField(max_length=255)
    joined_at = models.DateTimeField(auto_now_add=True)
    linkedin_link = models.URLField(null=True, blank=True)
    git_link = models.URLField(null=True, blank=True)

    def __str__(self):
        return self.user.username

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        img = Image.open(self.profile_image.path)

        if img.width > 300 or img.height > 300:
            output_size = (300, 300)
            img.thumbnail(output_size)
            img.save(self.profile_image.path)
            
class Application(models.Model):
   
    first_name = models.CharField(max_length=100)
    last_name =  models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    skills = models.CharField(max_length=255)
    cv = models.FileField(upload_to='cvs/', blank=True)
    project_link = models.URLField()
    about = models.TextField()
    status = models.CharField(choices=[
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    ], default='pending', max_length=20)
    applied_at = models.DateTimeField(auto_now_add=True)
    

    def __str__(self):
        return f'{self.first_name} application'


class Attendance(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField(default=timezone.localdate)
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    late_arrival = models.BooleanField(default=False)
    marked_today = models.BooleanField(default=False)
    was_absent = models.BooleanField(default=False)
    tracker = FieldTracker()
    

    class Meta:
            unique_together = ('user', 'date')

    def __str__(self):
        return f'{self.user.username} - {self.date}'
    
