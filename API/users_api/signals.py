# signals.py
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Employee, Application, Attendance
from dotenv import load_dotenv
from API.task_api.models import Notification
from API.task_api.tasks import send_mail_async
import os
load_dotenv()


def get_all_managers():
    return Employee.objects.filter(is_manager=True).values_list('user', flat=True)


@receiver(post_save, sender=User)
def create_employee(sender, instance, created, **kwargs):
    if created:
        Employee.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_employee(sender, instance, **kwargs):
    instance.employee.save()


@receiver(post_save, sender=Application)
def send_email(sender, instance, created, **kwargs):
    if created:
        send_mail_async.delay(
            subject='Your Application has been sent',
            message=f'Hello {instance.first_name}, your application has been sent to us. Please wait while we review it.',
            recipient=instance.email  
        )


@receiver(post_delete, sender=Application)
def send_rejection_mail(sender, instance, *args, **kwargs):
    send_mail_async.delay(
        subject='Rejection Email',
        message=f'Hello {instance.first_name}, your application was reviewed but unfortunately you were not selected.',
        recipient=instance.email  
    )


@receiver(pre_save, sender=Attendance)
def attendance_check_in_out_notification(sender, instance, **kwargs):
    if not instance.pk:
        return

    changed = instance.tracker.changed()
    manager_users = get_all_managers()
    if not manager_users:
        return

    notifications = []

    if 'check_in' in changed and instance.check_in is not None:
        for manager_id in manager_users:
            notifications.append(Notification(
                user_id=manager_id,
                message=f'{instance.user.username} checked in at {instance.check_in.strftime("%H:%M")} on {instance.date}',
                type='info'
            ))

    if 'check_out' in changed and instance.check_out is not None:
        for manager_id in manager_users:
            notifications.append(Notification(
                user_id=manager_id,
                message=f'{instance.user.username} checked out at {instance.check_out.strftime("%H:%M")} on {instance.date}',
                type='info'
            ))

    if notifications:
        Notification.objects.bulk_create(notifications)