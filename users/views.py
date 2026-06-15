from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from rest_framework import generics
from API.users_api.models import Employee, Application, Attendance
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated, AllowAny
from API.task_api.serializer import TaskSerializer, NotificationSerializer
from API.users_api.serializer import EmployeeSerializer, ApplicationSerializer, AttendanceSerializer 
from random import randint
import os
from dotenv import load_dotenv
from rest_framework import status
from .permissions import IsManager
from API.task_api.tasks import send_mail_async

load_dotenv()

class EmployeeListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = Employee.objects.get(user=request.user)
        user_serializer = EmployeeSerializer(user, many=False)

        if user.is_manager:
            employees = Employee.objects.exclude(user=request.user).exclude(is_manager=True)
            employees_serializer = EmployeeSerializer(employees, many=True)
            return  Response({
                'employee': user_serializer.data,
                'employees': employees_serializer.data
            })
           
        return Response({
            'employee' :user_serializer.data
        })


class ApplicationCreateView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
       
    

class ApplicationListView(APIView):
    permission_classes = [IsAuthenticated, IsManager]
    def get(self, request):
        applications = Application.objects.exclude(status='approved')
        serializer = ApplicationSerializer(applications, many=True)
        return Response(serializer.data)

class ApplicationDetailView(APIView):
    permission_classes = [IsAuthenticated, IsManager]
    def get(self, request, pk):
        application = get_object_or_404(Application, pk=pk)
        serializer = ApplicationSerializer(application, many=False)
        return Response(serializer.data)
    
class EmployeeCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsManager]
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

    def post(self, request, pk):
        
        application = get_object_or_404(Application, pk=pk)
     
        id = str(randint(10, 99))
        pass_code = str(randint(1000, 9999))
   
        password = f'{application.first_name}{pass_code}'
        user_name = f'{application.first_name}_{application.last_name}{id}'
      

        user = User.objects.create_user(username=user_name, password=password)
      
        employee = Employee.objects.get(user=user)
        
        employee.phone_number = application.phone
        employee.skills = application.skills
        employee.save()
       

        application.status = 'approved'
        application.save()
     

        send_mail_async.delay(
            subject='Your Application has been approved',
            message=f'Hello {application.first_name} {application.last_name}\n  you application as been approved your username is {user_name} \n your password is {password}',
            recipient=application.email,
        )
        
        return Response({'message': f'{application.first_name} {application.last_name}has been approved and added!'}, status=status.HTTP_201_CREATED)

class ApplicationDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, IsManager]
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer

    def delete(self, request, pk, *args, **kwargs):
        application = get_object_or_404(Application, pk=pk)
        application.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
    

class AttendanceView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, requset):
        attendance = Attendance.objects.filter(user=requset.user)
        attendance_serialized = AttendanceSerializer(attendance, many=True)
        return Response({'attendance' : attendance_serialized.data})
    
class AttendanceCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer

    def perform_create(self, serializer):
        print('perform_create called', serializer.validated_data)
        serializer.save(user=self.request.user)

class AttendanceUpdateView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        return Attendance.objects.filter(user=self.request.user)
    
class TeamAttendanceView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, requset):
        attendance = Attendance.objects.all()
        serializer = AttendanceSerializer(attendance, many=True)
        return Response({'attendance' : serializer.data})

class UpdateProfileView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EmployeeSerializer

    def get_queryset(self):
        return  Employee.objects.filter(user=self.request.user)

class UpdateLinksView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EmployeeSerializer

    def get_queryset(self):
        return  Employee.objects.filter(user=self.request.user)

def login(request):
    return render(request, 'users/login.html')

def register(request):
    return render(request, 'users/register.html')