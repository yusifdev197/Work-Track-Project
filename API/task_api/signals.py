from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Task, Notification
from API.users_api.models import Employee

@receiver(pre_save, sender=Task)
def task_status_notification(sender, instance, **kwargs):
    if not instance.pk:
        return

    try:
        old_task = Task.objects.get(pk=instance.pk)
    except Task.DoesNotExist:
        return
    
    if old_task.task_status != instance.task_status:
        messages = {
            'doing': {'message':'Your task in now in progress', 'type': 'success'},
            'reviewing': {'message' : 'Your task is currently being reviewed', 'type' : 'success'},
            'done': {'message' : 'Your task has been marked done', 'type' : 'success'},
            'failed': {'message' : 'Your task has been marked failed', 'type' : 'warning'},
            'pending': {'message' : 'Your task has been moved back to pending', 'type' : 'error'},
        }

        message = messages.get(instance.task_status)
        if message :
            Notification.objects.create(
                user=instance.assigned_to,
                message=f'{message['message']} - "{instance.title}"',
                type=message['type']
            )

@receiver(post_save, sender=Task)
def task_assigned_notification(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            user=instance.assigned_to,
            message=f'You have been assigned a new task "{instance.title}"',
            type='info' 
        )

