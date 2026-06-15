# tasks.py
from celery import shared_task
from django.core.mail import send_mail
from django.utils import timezone
from .models import Task, Notification
from API.users_api.models import Employee, Attendance
import os
from dotenv import load_dotenv
load_dotenv()


@shared_task
def send_mail_async(subject, message, recipient):
     send_mail(
        subject=subject,
        message=message,
        from_email=os.environ.get('Email'),
        recipient_list=[recipient],
        fail_silently=False,
    )


@shared_task
def mark_absent_employees():
    today = timezone.now().date()
    all_emps = Employee.objects.filter(is_manager=False).select_related('user')
    checked_in_today = Attendance.objects.filter(date=today).values_list('user_id', flat=True)  # fixed typo

    notifications = []
    for emp in all_emps:
        if emp.user.id not in checked_in_today:
            Attendance.objects.get_or_create(
                user=emp.user,
                date=today,
                defaults={'was_absent': True}
            )
            notifications.append(Notification(  # moved inside loop
                user=emp.user,
                message=f'You were marked absent on {today}',
                type='error'
            ))

    Notification.objects.bulk_create(notifications)


@shared_task
def check_due_dates():
    today = timezone.now().date()
    due_tasks = Task.objects.filter(
        due_date__lt=today,
        task_status__in=['pending', 'doing', 'reviewing']
    ).select_related('assigned_to')

    due_tasks.update(task_status='failed')

    notifications = [
        Notification(
            user=task.assigned_to,
            message=f'Your task "{task.title}" was marked failed — due date passed',
            type='error'
        )
        for task in due_tasks
    ]
    Notification.objects.bulk_create(notifications)