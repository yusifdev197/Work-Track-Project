from django.urls import path
from . import views


urlpatterns = [
    path('', views.Tasks, name='tasks-page'),
    path('get_tasks-api/', views.TaskListView.as_view(), name='get_task-api'),
    path('create_tasks-api/', views.TaskCreateView.as_view(), name='create_task-api'),
    path('update_task-api/<int:pk>', views.TaskUpdateView.as_view(), name='update_task-api'),
    path('notifications-api/', views.NotificationsView.as_view(), name='notifications-api'),
    path('mark_one_read_notifications-api/<int:pk>', views.NotifcationsMarkOneRead.as_view(), name='mark_one_read_notifications-api'),
    path('mark_all_read_notifications-api/', views.NotifcationsMarkAllRead.as_view(), name='mark_all_read_notifications-api'),
]
