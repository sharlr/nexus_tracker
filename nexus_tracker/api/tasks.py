import frappe
from frappe.utils import today,now_datetime

@frappe.whitelist()
def create_task(title,customer,priority="Medium",due_date=None,description=None,
                employees=None,supervisor=None,recurring=0,frequency=None,
                notify_manager=1,notify_supervisor=1,notify_customer=0):
    task=frappe.get_doc({"doctype":"ToDo","description":title,
        "reference_type":"Customer","reference_name":customer,
        "priority":priority,"date":due_date,"notes":description,
        "assigned_by":frappe.session.user}).insert(ignore_permissions=True)
    frappe.db.commit()
    return {"task":task.name}

@frappe.whitelist()
def complete_task(task_name,materials=None):
    frappe.db.set_value("ToDo",task_name,"status","Closed")
    frappe.publish_realtime("task_completed",{"task":task_name},room="managers")
    frappe.db.commit()
    return {"success":True}

@frappe.whitelist()
def create_recurring_tasks():
    frappe.db.commit()
    return {"success":True}

@frappe.whitelist()
def get_my_tasks():
    user=frappe.session.user
    emp=frappe.db.get_value("FT Employee",{"user":user,"is_active":1},"name")
    if not emp: return []
    return frappe.get_all("ToDo",filters={"allocated_to":user,"status":["!=","Cancelled"]},
        fields=["name","description","priority","date","status"])
