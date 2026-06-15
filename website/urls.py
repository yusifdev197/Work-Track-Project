from django.urls import path, include
from . import views


urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('applications/', views.application, name='applications'),
    path('application-detail/', views.application_detail, name='applications-detail'),
    path('attendance/', views.attendance, name='attendance'),
    path('overview/', views.overview, name='overview'),
    path('profile/', views.profile, name='profile'),
    path('notifications/', views.notifications, name='notifications')
    
]
