import frappe
from frappe.utils import now_datetime, today
import math


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dl = math.radians(lat2 - lat1)
    dg = math.radians(lon2 - lon1)
    a = math.sin(dl/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dg/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@frappe.whitelist()
def checkin(latitude, longitude, accuracy=None, altitude=None, speed=None,
            battery_level=None, gps_enabled=1, network_type=None, phone_model=None):
    user = frappe.session.user
    emp = frappe.db.get_value("FT Employee", {"user": user, "is_active": 1, "tracking_enabled": 1}, "name")
    if not emp:
        return {"success": False, "message": "Employee not found or tracking disabled"}
    shift = frappe.db.get_value("FT Shift", {"employee": emp, "date": today(), "is_active": 1}, "name")
    if not shift:
        shift = frappe.get_doc({"doctype": "FT Shift", "employee": emp, "date": today(),
            "started_at": now_datetime(), "is_active": 1}).insert(ignore_permissions=True).name
    last = frappe.db.get_value("FT Location Ping", {"employee": emp, "shift": shift},
        ["latitude", "longitude"], order_by="recorded_at desc")
    if last:
        km = haversine_km(float(last[0]), float(last[1]), float(latitude), float(longitude))
        frappe.db.set_value("FT Shift", shift, "total_km",
            (frappe.db.get_value("FT Shift", shift, "total_km") or 0) + km)
    ping = frappe.get_doc({"doctype": "FT Location Ping", "employee": emp, "shift": shift,
        "latitude": float(latitude), "longitude": float(longitude),
        "accuracy": float(accuracy) if accuracy else None,
        "altitude": float(altitude) if altitude else None,
        "speed": float(speed) if speed else None,
        "battery_level": int(battery_level) if battery_level else None,
        "gps_enabled": int(gps_enabled), "network_type": network_type,
        "phone_model": phone_model, "recorded_at": now_datetime()}).insert(ignore_permissions=True)
    frappe.publish_realtime("live_position", {
        "employee": emp,
        "employee_name": frappe.db.get_value("FT Employee", emp, "employee_name"),
        "latitude": float(latitude), "longitude": float(longitude),
        "battery_level": int(battery_level) if battery_level else None,
        "gps_enabled": int(gps_enabled), "network_type": network_type, "phone_model": phone_model,
    }, room="live_map")
    if battery_level and int(battery_level) <= 15:
        frappe.get_doc({"doctype": "FT Alert", "employee": emp, "alert_type": "Low Battery",
            "message": f"Battery at {battery_level}%", "is_read": 0,
            "created_at": now_datetime()}).insert(ignore_permissions=True)
    frappe.db.commit()
    return {"success": True, "shift": shift, "ping": ping.name}


@frappe.whitelist()
def get_today_shift():
    user = frappe.session.user
    emp = frappe.db.get_value("FT Employee", {"user": user, "is_active": 1}, "name")
    if not emp:
        return None
    return frappe.db.get_value("FT Shift", {"employee": emp, "date": today()},
        ["name", "started_at", "ended_at", "total_km", "total_minutes", "is_active"], as_dict=True)
