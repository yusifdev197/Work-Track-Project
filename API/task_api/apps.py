from django.apps import AppConfig


class TaskApiConfig(AppConfig):
    name = 'API.task_api'

    def ready(self):
        import API.task_api.signals