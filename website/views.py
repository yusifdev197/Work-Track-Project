from django.shortcuts import render
from API.users_api.models import Employee

def dashboard(request):
    return render(request, 'website/dashboard.html')

def application(request):
    return render(request, 'website/applications.html')

def application_detail(request):
    return render(request, 'website/applications-detail.html')

def attendance(request):
    return render(request, 'website/attendance.html')

def overview(request):
    return render(request, 'website/overview.html')

def profile(request):
    return render(request, 'website/profile.html')

def notifications(request):
    return render(request, 'website/notifications.html')
