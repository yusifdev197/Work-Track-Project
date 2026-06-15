from django.shortcuts import render
from rest_framework.views import APIView
from API.task_api.models import Task, Notification
from API.users_api.models import Employee
from API.task_api.serializer import TaskSerializer, NotificationSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework import generics
from datetime import timedelta
from django.utils import timezone

now = timezone.now()

last_week_threshold = now - timedelta(days=7)
 
# Create your views here.
class TaskListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = Employee.objects.get(user=request.user)
        if user.is_manager:
            tasks = Task.objects.all()
            tasks_last_week = Task.objects.filter(created_at__gte=last_week_threshold, task_status='done')
            tasks_this_month = Task.objects.filter(created_at__year=now.year, created_at__month=now.month, task_status='done')

            tasks_serilizer = TaskSerializer(tasks, many=True)
            tasks_serilized_last_week = TaskSerializer(tasks_last_week, many=True)
            tasks_serilized_this_month = TaskSerializer(tasks_this_month, many=True)

        else:
            tasks = Task.objects.filter(assigned_to=request.user)
            tasks_last_week = Task.objects.filter(created_at__gte=last_week_threshold, task_status='done', assigned_to=request.user)
            tasks_this_month = Task.objects.filter(created_at__year=now.year, created_at__month=now.month, task_status='done', assigned_to=request.user)


            tasks_serilizer = TaskSerializer(tasks, many=True)
            tasks_serilized_last_week = TaskSerializer(tasks_last_week, many=True)
            tasks_serilized_this_month = TaskSerializer(tasks_this_month, many=True)

        return Response({
            'tasks':tasks_serilizer.data, 
            'tasks_last_week': tasks_serilized_last_week.data, 
            'tasks_this_month': tasks_serilized_this_month.data,
        })

    
class TaskCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)

class TaskUpdateView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Task.objects.all()
    serializer_class = TaskSerializer


class NotificationsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        noti = Notification.objects.filter(user=self.request.user).order_by('-created_at')
        serializer = NotificationSerializer(noti, many=True)
        return Response({'notifications': serializer.data})
    
class NotifcationsMarkOneRead(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, pk):
        noti = Notification.objects.filter(pk=pk, user=request.user).first()
        if not noti:
            return Response(status=404)
        noti.is_read = True
        noti.save()
        return Response({'detail': 'Marked as Read'})

class NotifcationsMarkAllRead(APIView):
    permission_classes = [IsAuthenticated]
    def patch(self, request):
        Notification.objects.filter(user=self.request.user, is_read=False).update(is_read=True)
        return Response({'detail' : 'All Marked as Read'})
    
def Tasks(request):
    return render(request, 'tasks/tasks.html')