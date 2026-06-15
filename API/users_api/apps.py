from django.apps import AppConfig


class UsersApiConfig(AppConfig):
    name = 'API.users_api'

    def ready(self):
        import API.users_api.signals