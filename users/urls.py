from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path('login/', views.login, name='login'),
    path('register/', views.register, name='register'),
    path('login-api/', TokenObtainPairView.as_view(), name='api-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='api-token_refresh'),
    path('create_application-api/', views.ApplicationCreateView.as_view(), name='create_application-api'),
    path('employee-api/', views.EmployeeListView.as_view(), name='employee-api'),
    path('applications-api/', views.ApplicationListView.as_view(), name='applications-api'),
    path('application_detail-api/<int:pk>', views.ApplicationDetailView.as_view(), name='application_detail-api'),
    path('create_employee-api/<int:pk>', views.EmployeeCreateView.as_view(), name='create_employee-api'),
    path('delete_application-api/<int:pk>', views.ApplicationDeleteView.as_view(), name='delete_application-api'),
    path('create_attendance-api/', views.AttendanceCreateView.as_view(), name='create_attendance-api'),
    path('update_attendance-api/<int:pk>', views.AttendanceUpdateView.as_view(), name='update_attendance-api'),
    path('attendance-api/', views.AttendanceView.as_view(), name='attendance-api'),
    path('team_attendance-api/', views.TeamAttendanceView.as_view(), name='team_attendance-api'),
    path('update_profile-api/<int:pk>', views.UpdateProfileView.as_view(), name='update_profile-api'),
    path('update_links-api/<int:pk>', views.UpdateLinksView.as_view(), name='update_link-api')
    
]
