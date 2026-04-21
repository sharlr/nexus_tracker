import frappe
from frappe.utils import now_datetime,add_to_date

@frappe.whitelist()
def check_inactive_employees():
    threshold=add_to_date(now_datetime(),minutes=-90)
    for shift in frappe.get_all("FT Shift",filters={"is_active":1},fields=["name","employee"]):
        last=frappe.db.get_value("FT Location Ping",{"employee":shift.employee,"shift":shift.name},
            "recorded_at",order_by="recorded_at desc")
        if last and last<threshold:
            if not frappe.db.exists("FT Alert",{"employee":shift.employee,"alert_type":"Inactivity",
                "is_read":0,"created_at":[">",add_to_date(now_datetime(),hours=-2)]}):
                frappe.get_doc({"doctype":"FT Alert","employee":shift.employee,
                    "alert_type":"Inactivity","message":"No GPS ping for 90+ minutes",
                    "is_read":0,"created_at":now_datetime()}).insert(ignore_permissions=True)
    frappe.db.commit()

@frappe.whitelist()
def check_low_battery():
    pings=frappe.db.sql("""SELECT DISTINCT employee,battery_level FROM `tabFT Location Ping`
        WHERE battery_level<=15 AND battery_level IS NOT NULL AND recorded_at>=%s""",
        add_to_date(now_datetime(),minutes=-20),as_dict=True)
    for p in pings:
        if not frappe.db.exists("FT Alert",{"employee":p.employee,"alert_type":"Low Battery",
            "is_read":0,"created_at":[">",add_to_date(now_datetime(),hours=-1)]}):
            frappe.get_doc({"doctype":"FT Alert","employee":p.employee,
                "alert_type":"Low Battery","message":f"Battery at {p.battery_level}%",
                "is_read":0,"created_at":now_datetime()}).insert(ignore_permissions=True)
    frappe.db.commit()

@frappe.whitelist()
def get_alerts(unread_only=0,alert_type=None,employee=None,limit=50):
    f={}
    if int(unread_only): f["is_read"]=0
    if alert_type: f["alert_type"]=alert_type
    if employee: f["employee"]=employee
    return frappe.get_all("FT Alert",filters=f,
        fields=["name","employee","alert_type","message","latitude","longitude","is_read","created_at"],
        order_by="created_at desc",limit=int(limit))

@frappe.whitelist()
def mark_alert_read(alert_name):
    frappe.db.set_value("FT Alert",alert_name,"is_read",1)
    frappe.db.commit()
    return {"success":True}
