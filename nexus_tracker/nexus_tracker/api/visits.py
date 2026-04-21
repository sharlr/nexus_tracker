import frappe
from frappe.utils import now_datetime


@frappe.whitelist()
def get_clients():
    return frappe.get_all("FT Client", fields=["name", "client_name", "latitude", "longitude"])


@frappe.whitelist()
def start_visit(client, latitude, longitude, shift=None):
    user = frappe.session.user
    emp = frappe.db.get_value("FT Employee", {"user": user, "is_active": 1}, "name")
    visit = frappe.get_doc({"doctype": "FT Client Visit", "employee": emp, "shift": shift,
        "client": client, "checked_in_at": now_datetime(),
        "latitude": float(latitude), "longitude": float(longitude)}).insert(ignore_permissions=True)
    frappe.db.commit()
    return {"visit": visit.name}


@frappe.whitelist()
def end_visit(visit_name, rating=None, notes=None, latitude=None, longitude=None, signature=None):
    v = frappe.get_doc("FT Client Visit", visit_name)
    v.checked_out_at = now_datetime()
    if rating: v.rating = int(rating)
    if notes: v.notes = notes
    if latitude: v.latitude = float(latitude)
    if longitude: v.longitude = float(longitude)
    if signature: v.signature = signature
    v.save(ignore_permissions=True)
    frappe.db.commit()
    return {"success": True}


@frappe.whitelist()
def get_today_visits():
    user = frappe.session.user
    emp = frappe.db.get_value("FT Employee", {"user": user, "is_active": 1}, "name")
    return frappe.get_all("FT Client Visit",
        filters={"employee": emp, "checked_in_at": [">=", frappe.utils.today()]},
        fields=["name", "client", "checked_in_at", "checked_out_at", "rating"])
