from django.contrib import admin

from .models import CambioDealer, Dealer


@admin.register(Dealer)
class DealerAdmin(admin.ModelAdmin):
    list_display = ["nombre", "plan", "modo", "estado_pago", "ciudad", "estado_region"]
    list_filter = ["plan", "modo", "estado_pago", "estado_region"]
    search_fields = ["nombre", "ciudad", "email"]


@admin.register(CambioDealer)
class CambioDealerAdmin(admin.ModelAdmin):
    list_display = ["fecha", "dealer", "campo", "antes", "despues", "usuario"]
    list_filter = ["campo"]
    readonly_fields = ["fecha", "dealer", "campo", "antes", "despues", "usuario"]
