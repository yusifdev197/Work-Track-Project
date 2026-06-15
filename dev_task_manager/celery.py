import os
from celery import Celery
from celery.signals import worker_ready
from celery.schedules import crontab


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dev_task_manager.settings')

app = Celery('dev_task_manager')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

@worker_ready.connect
def on_work_ready(sender, **kwargs):
    from API.task_api.tasks import check_due_dates ,mark_absent_employees
    check_due_dates.delay()
    mark_absent_employees.delay()


app.conf.beat_schedule = {
    'mark-absent-every-night':{
        'task': 'API.task_api.tasks.mark_absent_employee',
        'schedule': crontab(hour=23, minute=59)
    },
    'check-due-dates-every-morning':{
        'task': 'API.task_api.tasks.check_due_dates',
        'schedule': crontab(hour=8, minute=0)
    }
}