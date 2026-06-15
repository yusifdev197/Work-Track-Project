from rest_framework.permissions import BasePermission


class IsManager(BasePermission):
    def has_permission(self, request, view):
        try:
            return request.user.employee.is_manager
        except:
            return False